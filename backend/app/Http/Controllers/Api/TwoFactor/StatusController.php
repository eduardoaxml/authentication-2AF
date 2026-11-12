<?php

namespace App\Http\Controllers\Api\TwoFactor;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatusController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $isEnabled = $user->two_factor_confirmed_at !== null;

        $recoveryCodesRemaining = $isEnabled
            ? $user->twoFactorRecoveryCodes()
                ->whereNull('used_at')
                ->count()
            : 0;

        return response()->json([
            'two_factor_enabled' => $isEnabled,
            'two_factor_confirmed_at' => $user->two_factor_confirmed_at,
            'recovery_codes_remaining' => $recoveryCodesRemaining,
        ]);
    }
}
