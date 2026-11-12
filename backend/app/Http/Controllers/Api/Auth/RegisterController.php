<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class RegisterController extends Controller
{
    public function __invoke(RegisterRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        Auth::guard('web')->login($user);

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Registration successful.',
            'user' => $user,
        ], 201);
    }
}
