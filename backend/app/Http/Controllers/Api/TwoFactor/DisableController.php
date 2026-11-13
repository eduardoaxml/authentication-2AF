<?php

namespace App\Http\Controllers\Api\TwoFactor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\TwoFactor\DisableRequest;
use App\Models\User;
use App\Services\TwoFactor\TotpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DisableController extends Controller
{
    public function __invoke(
        DisableRequest $request,
        TotpService $totpService,
    ): JsonResponse {
        /** @var User $authenticatedUser */
        $authenticatedUser = $request->user();

        DB::transaction(function () use (
            $authenticatedUser,
            $request,
            $totpService,
        ): void {
            $user = User::query()
                ->lockForUpdate()
                ->findOrFail($authenticatedUser->getKey());

            if (
                $user->two_factor_confirmed_at === null
                || $user->two_factor_secret === null
            ) {
                abort(409, 'Two-factor authentication is not enabled.');
            }

            $timeStep = $totpService->getMatchingTimeStep(
                $user->two_factor_secret,
                $request->validated('code'),
            );

            $lastUsedTimeStep = $user->two_factor_last_used_at;

            if (
                $timeStep === null
                || (
                    $lastUsedTimeStep !== null
                    && $timeStep <= (int) $lastUsedTimeStep
                )
            ) {
                throw ValidationException::withMessages([
                    'code' => ['The provided authentication code is invalid or has already been used.'],
                ]);
            }

            $user->twoFactorRecoveryCodes()->delete();

            $user->forceFill([
                'two_factor_secret' => null,
                'two_factor_confirmed_at' => null,
                'two_factor_last_used_at' => null,
            ])->save();
        });

        return response()->json([
            'message' => 'Two-factor authentication disabled successfully.',
            'two_factor_enabled' => false,
        ]);
    }
}
