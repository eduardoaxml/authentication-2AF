<?php

namespace App\Http\Controllers\Api\TwoFactor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\TwoFactor\ConfirmRequest;
use App\Models\User;
use App\Services\TwoFactor\TotpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ConfirmController extends Controller
{
    public function __invoke(
        ConfirmRequest $request,
        TotpService $totpService,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        if ($user->two_factor_confirmed_at !== null) {
            return response()->json([
                'message' => 'Two-factor authentication is already enabled.',
            ], 409);
        }

        if ($user->two_factor_secret === null) {
            throw ValidationException::withMessages([
                'code' => ['Two-factor authentication setup has not been started.'],
            ]);
        }

        $isValid = $totpService->verifyCode(
            $user->two_factor_secret,
            $request->validated('code'),
        );

        if (! $isValid) {
            throw ValidationException::withMessages([
                'code' => ['The provided authentication code is invalid.'],
            ]);
        }

        $user->two_factor_confirmed_at = now();
        $user->save();

        return response()->json([
            'message' => 'Two-factor authentication enabled successfully.',
            'two_factor_enabled' => true,
        ]);
    }
}
