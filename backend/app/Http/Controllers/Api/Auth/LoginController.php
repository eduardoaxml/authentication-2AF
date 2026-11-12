<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    private const TWO_FACTOR_PENDING_USER = 'auth.two_factor_pending_user_id';

    private const TWO_FACTOR_PENDING_EXPIRES = 'auth.two_factor_pending_expires_at';

    private const TWO_FACTOR_CHALLENGE_MINUTES = 5;

    public function __invoke(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        $guard = Auth::guard('web');

        if (! $guard->validate($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = User::query()
            ->where('email', $credentials['email'])
            ->firstOrFail();

        if ($user->two_factor_confirmed_at !== null) {
            $request->session()->put([
                self::TWO_FACTOR_PENDING_USER => $user->getKey(),
                self::TWO_FACTOR_PENDING_EXPIRES => now()
                    ->addMinutes(self::TWO_FACTOR_CHALLENGE_MINUTES)
                    ->timestamp,
            ]);

            $request->session()->regenerate();

            return response()->json([
                'message' => 'Two-factor authentication required.',
                'two_factor_required' => true,
            ]);
        }

        $guard->login($user);

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user,
        ]);
    }
}
