<?php

namespace App\Http\Controllers\Api\TwoFactor;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChallengeStatusController extends Controller
{
    private const TWO_FACTOR_PENDING_USER = 'auth.two_factor_pending_user_id';

    private const TWO_FACTOR_PENDING_EXPIRES = 'auth.two_factor_pending_expires_at';

    public function __invoke(Request $request): JsonResponse
    {
        $session = $request->session();

        $userId = $session->get(self::TWO_FACTOR_PENDING_USER);
        $expiresAt = $session->get(self::TWO_FACTOR_PENDING_EXPIRES);

        if (
            ! $userId
            || ! $expiresAt
            || now()->timestamp >= $expiresAt
        ) {
            $this->clearPendingChallenge($request);

            return response()->json([
                'two_factor_required' => false,
            ]);
        }

        $user = User::query()->find($userId);

        if (
            ! $user
            || $user->two_factor_confirmed_at === null
            || $user->two_factor_secret === null
        ) {
            $this->clearPendingChallenge($request);

            return response()->json([
                'two_factor_required' => false,
            ]);
        }

        return response()->json([
            'two_factor_required' => true,
        ]);
    }

    private function clearPendingChallenge(Request $request): void
    {
        $request->session()->forget([
            self::TWO_FACTOR_PENDING_USER,
            self::TWO_FACTOR_PENDING_EXPIRES,
        ]);
    }
}
