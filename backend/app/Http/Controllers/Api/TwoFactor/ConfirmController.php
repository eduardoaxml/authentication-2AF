<?php

namespace App\Http\Controllers\Api\TwoFactor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\TwoFactor\ConfirmRequest;
use App\Models\User;
use App\Services\TwoFactor\TotpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConfirmController extends Controller
{
    public function __invoke(
        ConfirmRequest $request,
        TotpService $totpService,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        return DB::transaction(function () use (
            $user,
            $request,
            $totpService,
        ): JsonResponse {
            $lockedUser = User::query()
                ->lockForUpdate()
                ->findOrFail($user->getKey());

            if ($lockedUser->two_factor_confirmed_at !== null) {
                return response()->json([
                    'message' => 'Two-factor authentication is already enabled.',
                ], 409);
            }

            if ($lockedUser->two_factor_secret === null) {
                throw ValidationException::withMessages([
                    'code' => ['Two-factor authentication setup has not been started.'],
                ]);
            }

            $timeStep = $totpService->getMatchingTimeStep(
                $lockedUser->two_factor_secret,
                $request->validated('code'),
            );

            if ($timeStep === null) {
                throw ValidationException::withMessages([
                    'code' => ['The provided authentication code is invalid.'],
                ]);
            }

            $lockedUser->forceFill([
                'two_factor_last_used_at' => $timeStep,
                'two_factor_confirmed_at' => now(),
            ])->save();

            return response()->json([
                'message' => 'Two-factor authentication enabled successfully.',
                'two_factor_enabled' => true,
            ]);
        });
    }
}
