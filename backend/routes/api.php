<?php

use App\Http\Controllers\Api\Auth\RegisterController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\TwoFactor\SetupController;

Route::post('/register', RegisterController::class)
    ->name('register');

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
Route::post('/login', LoginController::class)
    ->name('login');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/two-factor/setup', SetupController::class)
        ->middleware('throttle:6,1')
        ->name('two-factor.setup');
});
