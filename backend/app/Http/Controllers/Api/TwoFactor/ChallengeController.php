<?php

namespace App\Http\Controllers\Api\TwoFactor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\TwoFactor\ChallengeRequest;
use App\Models\User;
use App\Services\TwoFactor\RecoveryCodeService;
use App\Services\TwoFactor\TotpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ChallengeController extends Controller
{
    private const PENDING_USER = 'auth.two_factor_pending_user_id';

    private const PENDING_EXPIRES = 'auth.two_factor_pending_expires_at';

    public function __invoke(
        ChallengeRequest $request,
        TotpService $totpService,
        RecoveryCodeService $recoveryCodeService,
    ): JsonResponse {
        $session = $request->session();

        $userId = $session->get(self::PENDING_USER);
        $expiresAt = $session->get(self::PENDING_EXPIRES);

        if (
            $userId === null
            || $expiresAt === null
            || now()->timestamp >= $expiresAt
        ) {
            $session->forget([
                self::PENDING_USER,
                self::PENDING_EXPIRES,
            ]);

            return response()->json([
                'message' => 'The authentication challenge has expired. Please log in again.',
            ], 401);
        }

        $user = User::query()->find($userId);

        if (
            $user === null
            || $user->two_factor_confirmed_at === null
            || $user->two_factor_secret === null
        ) {
            $session->forget([
                self::PENDING_USER,
                self::PENDING_EXPIRES,
            ]);

            return response()->json([
                'message' => 'The authentication challenge is invalid. Please log in again.',
            ], 401);
        }

        $code = $request->validated('code');

        if (preg_match('/^\d{6}$/', $code)) {
            $isValid = DB::transaction(function () use (
                $user,
                $code,
                $totpService,
            ): bool {
                $lockedUser = User::query()
                    ->lockForUpdate()
                    ->find($user->getKey());

                if (
                    $lockedUser === null
                    || $lockedUser->two_factor_confirmed_at === null
                    || $lockedUser->two_factor_secret === null
                ) {
                    return false;
                }

                $timeStep = $totpService->getMatchingTimeStep(
                    $lockedUser->two_factor_secret,
                    $code,
                );

                if ($timeStep === null) {
                    return false;
                }

                $lastUsedTimeStep = $lockedUser->two_factor_last_used_at;

                if (
                    $lastUsedTimeStep !== null
                    && $timeStep <= (int) $lastUsedTimeStep
                ) {
                    return false;
                }

                $lockedUser->forceFill([
                    'two_factor_last_used_at' => $timeStep,
                ])->save();

                return true;
            });
        } else {
            $isValid = $recoveryCodeService->consume($user, $code);
        }

        if (! $isValid) {
            throw ValidationException::withMessages([
                'code' => ['The provided authentication code is invalid.'],
            ]);
        }

        $session->forget([
            self::PENDING_USER,
            self::PENDING_EXPIRES,
        ]);

        Auth::guard('web')->login($user);

        $session->regenerate();

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user,
        ]);
    }
}
