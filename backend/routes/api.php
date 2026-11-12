<?php

use App\Http\Controllers\Api\Auth\RegisterController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\TwoFactor\SetupController;
use App\Http\Controllers\Api\TwoFactor\ConfirmController;
use App\Http\Controllers\Api\TwoFactor\RecoveryCodeController;
use App\Http\Controllers\Api\TwoFactor\ChallengeController;

Route::post('/register', RegisterController::class)
    ->name('register');

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
Route::post('/login', LoginController::class)
    ->name('login');

Route::post('/two-factor/challenge', ChallengeController::class)
    ->middleware('throttle:6,1')
    ->name('two-factor.challenge');
Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/two-factor/setup', SetupController::class)
        ->middleware('throttle:6,1')
        ->name('two-factor.setup');
    Route::post('/two-factor/confirm', ConfirmController::class)
        ->middleware('throttle:6,1')
        ->name('two-factor.confirm');
    Route::post('/two-factor/recovery-codes/regenerate', RecoveryCodeController::class)
        ->middleware('throttle:3,1')
        ->name('two-factor.recovery-codes.regenerate');

});

