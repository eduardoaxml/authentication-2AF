<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use OTPHP\InternalClock;
use OTPHP\TOTP;
use Tests\TestCase;

class TwoFactorChallengeTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'JBSWY3DPEHPK3PXP';

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);

        $this->withHeaders([
            'Origin' => 'http://localhost:5173',
        ]);
    }

    private function createPendingChallenge(User $user): void
    {
        $this->withoutMiddleware(ValidateCsrfToken::class);

        $this->withHeaders([
            'Origin' => 'http://localhost:5173',
        ]);

        $this->withSession([
            'auth.two_factor_pending_user_id' => $user->getKey(),
            'auth.two_factor_pending_expires_at' => now()
                ->addMinutes(5)
                ->timestamp,
        ]);
    }

    public function test_user_can_complete_challenge_with_valid_totp_code(): void
    {
        $user = User::factory()->create([
            'two_factor_secret' => self::SECRET,
            'two_factor_confirmed_at' => now(),
        ]);

        $this->createPendingChallenge($user);

        $code = TOTP::createFromSecret(
            self::SECRET,
            new InternalClock,
        )->now();

        $response = $this->postJson('/api/two-factor/challenge', [
            'code' => $code,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Login successful.')
            ->assertJsonPath('user.email', $user->email);

        $this->assertAuthenticatedAs($user, 'web');

        $this->assertNotNull(
            $user->refresh()->two_factor_last_used_at,
        );

        $this->assertNull(session('auth.two_factor_pending_user_id'));
    }

    public function test_user_can_complete_challenge_with_recovery_code(): void
    {
        $plainCode = 'A1B2-C3D4-E5F6-G7H8';

        $user = User::factory()->create([
            'two_factor_secret' => self::SECRET,
            'two_factor_confirmed_at' => now(),
        ]);

        $user->twoFactorRecoveryCodes()->create([
            'code_hash' => Hash::make(str_replace('-', '', $plainCode)),
        ]);

        $this->createPendingChallenge($user);

        $this->postJson('/api/two-factor/challenge', [
            'code' => $plainCode,
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Login successful.');

        $this->assertAuthenticatedAs($user, 'web');

        $this->assertNotNull(
            $user->twoFactorRecoveryCodes()->firstOrFail()->used_at,
        );
    }

    public function test_recovery_code_cannot_be_used_twice(): void
    {
        $plainCode = 'A1B2-C3D4-E5F6-G7H8';

        $user = User::factory()->create([
            'two_factor_secret' => self::SECRET,
            'two_factor_confirmed_at' => now(),
        ]);

        $user->twoFactorRecoveryCodes()->create([
            'code_hash' => Hash::make(str_replace('-', '', $plainCode)),
            'used_at' => now(),
        ]);

        $this->createPendingChallenge($user);

        $this->postJson('/api/two-factor/challenge', [
            'code' => $plainCode,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);

        $this->assertGuest('web');
    }

    public function test_invalid_code_does_not_authenticate_user(): void
    {
        $user = User::factory()->create([
            'two_factor_secret' => self::SECRET,
            'two_factor_confirmed_at' => now(),
        ]);

        $this->createPendingChallenge($user);

        $this->postJson('/api/two-factor/challenge', [
            'code' => '000000',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);

        $this->assertGuest('web');
    }

    public function test_expired_challenge_is_rejected(): void
    {
        $user = User::factory()->create([
            'two_factor_secret' => self::SECRET,
            'two_factor_confirmed_at' => now(),
        ]);

        $this->withSession([
            'auth.two_factor_pending_user_id' => $user->getKey(),
            'auth.two_factor_pending_expires_at' => now()
                ->subMinute()
                ->timestamp,
        ]);

        $this->postJson('/api/two-factor/challenge', [
            'code' => '123456',
        ])->assertUnauthorized();

        $this->assertGuest('web');
    }

    public function test_challenge_requires_a_pending_login(): void
    {
        $this->postJson('/api/two-factor/challenge', [
            'code' => '123456',
        ])->assertUnauthorized();

        $this->assertGuest('web');
    }

    public function test_totp_code_cannot_be_used_twice(): void
    {
        $user = User::factory()->create([
            'two_factor_secret' => self::SECRET,
            'two_factor_confirmed_at' => now(),
        ]);

        $this->createPendingChallenge($user);

        $code = TOTP::createFromSecret(
            self::SECRET,
            new InternalClock,
        )->now();

        $this->postJson('/api/two-factor/challenge', [
            'code' => $code,
        ])->assertOk();

        Auth::guard('web')->logout();

        $this->createPendingChallenge($user);

        $this->postJson('/api/two-factor/challenge', [
            'code' => $code,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);

        $this->assertGuest('web');
    }

    public function test_new_totp_time_step_is_accepted(): void
    {
        $user = User::factory()->create([
            'two_factor_secret' => self::SECRET,
            'two_factor_confirmed_at' => now(),
            'two_factor_last_used_at' => intdiv(time(), 30) - 1,
        ]);

        $this->createPendingChallenge($user);

        $code = TOTP::createFromSecret(
            self::SECRET,
            new InternalClock,
        )->now();

        $this->postJson('/api/two-factor/challenge', [
            'code' => $code,
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Login successful.');

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_invalid_totp_code_does_not_update_last_used_time_step(): void
    {
        $user = User::factory()->create([
            'two_factor_secret' => self::SECRET,
            'two_factor_confirmed_at' => now(),
        ]);

        $this->createPendingChallenge($user);

        $this->postJson('/api/two-factor/challenge', [
            'code' => '000000',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);

        $this->assertNull(
            $user->refresh()->two_factor_last_used_at,
        );
    }
}
