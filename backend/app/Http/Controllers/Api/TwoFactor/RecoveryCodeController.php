<?php

namespace App\Http\Controllers\Api\TwoFactor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\TwoFactor\RegenerateRecoveryCodesRequest;
use App\Models\User;
use App\Services\TwoFactor\RecoveryCodeService;
use Illuminate\Http\JsonResponse;

class RecoveryCodeController extends Controller
{
    public function __invoke(
        RegenerateRecoveryCodesRequest $request,
        RecoveryCodeService $recoveryCodeService,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        if ($user->two_factor_confirmed_at === null) {
            return response()->json([
                'message' => 'Two-factor authentication is not enabled.',
            ], 409);
        }

        $codes = $recoveryCodeService->regenerate($user);

        return response()->json([
            'message' => 'Recovery codes generated successfully. Store them securely.',
            'recovery_codes' => $codes,
        ]);
    }
}
