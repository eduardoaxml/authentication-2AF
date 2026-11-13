<?php

namespace App\Http\Controllers\Api\TwoFactor;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TwoFactor\QrCodeService;
use App\Services\TwoFactor\TotpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SetupController extends Controller
{
    public function __invoke(
        Request $request,
        TotpService $totpService,
        QrCodeService $qrCodeService,
    ): JsonResponse {
        /** @var User $authenticatedUser */
        $authenticatedUser = $request->user();

        return DB::transaction(function () use (
            $authenticatedUser,
            $totpService,
            $qrCodeService,
        ): JsonResponse {
            $user = User::query()
                ->lockForUpdate()
                ->findOrFail($authenticatedUser->getKey());

            if ($user->two_factor_confirmed_at !== null) {
                return response()->json([
                    'message' => 'Two-factor authentication is already enabled.',
                ], 409);
            }

            if ($user->two_factor_secret === null) {
                $user->two_factor_secret = $totpService->generateSecret();
                $user->save();
            }

            $provisioningUri = $totpService->getProvisioningUri(
                $user->two_factor_secret,
                $user->email,
            );

            return response()->json([
                'message' => 'Scan the QR code with your authenticator app.',
                'secret' => $user->two_factor_secret,
                'qr_code' => $qrCodeService->generateDataUri($provisioningUri),
            ]);
        });
    }
}
