<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        $this->withoutMiddleware(ValidateCsrfToken::class);

        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
        ])->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Login successful.')
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonMissingPath('user.password');

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'wrong-password',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertGuest('web');
    }

    public function test_login_requires_email_and_password(): void
    {
        $response = $this->postJson('/api/login', []);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
                'password',
            ]);

        $this->assertGuest('web');
    }

    public function test_user_cannot_login_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'unknown@example.com',
            'password' => 'password123',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertGuest('web');
    }

    public function test_user_with_two_factor_enabled_receives_a_challenge_instead_of_authentication(): void
    {
        $this->withoutMiddleware(ValidateCsrfToken::class);

        $user = User::factory()->create([
            'email' => 'two-factor@example.com',
            'password' => 'password123',
            'two_factor_secret' => 'JBSWY3DPEHPK3PXP',
            'two_factor_confirmed_at' => now(),
        ]);

        $response = $this->withHeaders([
            'Origin' => 'http://localhost:5173',
        ])->postJson('/api/login', [
            'email' => 'two-factor@example.com',
            'password' => 'password123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('two_factor_required', true)
            ->assertJsonMissingPath('user');

        $this->assertGuest('web');

        $this->assertSame(
            $user->getKey(),
            session('auth.two_factor_pending_user_id'),
        );
    }
}
