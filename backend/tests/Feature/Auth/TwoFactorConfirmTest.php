<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\TwoFactor\TotpService;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use OTPHP\InternalClock;
use OTPHP\TOTP;
use Tests\TestCase;

class TwoFactorConfirmTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'JBSWY3DPEHPK3PXP';

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(ValidateCsrfToken::class);

        $this->withHeaders([
            'Origin' => config('app.frontend_url'),
        ]);
    }

    public function test_user_can_enable_two_factor_with_valid_code(): void
    {
        $user = User::factory()->create([
            'two_factor_secret' => self::SECRET,
        ]);

        $code = TOTP::createFromSecret(
            self::SECRET,
            new InternalClock,
        )->now();

        $this->actingAs($user, 'web')
            ->postJson('/api/two-factor/confirm', [
                'code' => $code,
            ])
            ->assertOk()
            ->assertJsonPath('two_factor_enabled', true);

        $this->assertNotNull(
            $user->fresh()->two_factor_confirmed_at,
        );

        $this->assertNotNull(
            $user->refresh()->two_factor_last_used_at,
        );

    }

    public function test_user_cannot_enable_two_factor_with_invalid_code(): void
    {
        $user = User::factory()->create([
            'two_factor_secret' => self::SECRET,
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/two-factor/confirm', [
                'code' => '000000',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);

        $this->assertNull(
            $user->fresh()->two_factor_confirmed_at,
        );
    }

    public function test_user_cannot_confirm_without_starting_setup(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web')
            ->postJson('/api/two-factor/confirm', [
                'code' => '123456',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);
    }

    public function test_user_cannot_confirm_with_malformed_code(): void
    {
        $user = User::factory()->create([
            'two_factor_secret' => self::SECRET,
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/two-factor/confirm', [
                'code' => '12345',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);
    }

    public function test_user_cannot_confirm_two_factor_twice(): void
    {
        $user = User::factory()->create([
            'two_factor_secret' => self::SECRET,
            'two_factor_confirmed_at' => now(),
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/two-factor/confirm', [
                'code' => '123456',
            ])
            ->assertConflict();
    }

    public function test_unauthenticated_user_cannot_confirm_two_factor(): void
    {
        $this->postJson('/api/two-factor/confirm', [
            'code' => '123456',
        ])->assertUnauthorized();
    }

    public function test_confirmation_records_the_used_totp_time_step(): void
    {
        $user = User::factory()->create([
            'two_factor_secret' => self::SECRET,
            'two_factor_confirmed_at' => null,
        ]);

        $code = TOTP::createFromSecret(
            self::SECRET,
            new InternalClock,
        )->now();

        $this->actingAs($user)
            ->postJson('/api/two-factor/confirm', [
                'code' => $code,
            ])
            ->assertOk();

        $this->assertNotNull(
            $user->refresh()->two_factor_last_used_at,
        );
    }

    public function test_confirmation_code_cannot_be_reused_during_login(): void
    {
        $code = TOTP::createFromSecret(
            self::SECRET,
            new InternalClock,
        )->now();

        $timeStep = app(TotpService::class)->getMatchingTimeStep(
            self::SECRET,
            $code,
        );

        $this->assertNotNull($timeStep);

        $user = User::factory()->create([
            'two_factor_secret' => self::SECRET,
            'two_factor_confirmed_at' => now(),
            'two_factor_last_used_at' => $timeStep,
        ]);

        $this->withSession([
            'auth.two_factor_pending_user_id' => $user->id,
            'auth.two_factor_pending_expires_at' => now()->addMinutes(5)->timestamp,
        ]);

        $this->postJson('/api/two-factor/challenge', [
            'code' => $code,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code']);

        $this->assertGuest('web');
    }
}
