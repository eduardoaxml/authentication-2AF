<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use OTPHP\InternalClock;
use OTPHP\TOTP;
use Tests\TestCase;

class TwoFactorDisableTest extends TestCase
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

    public function test_user_can_disable_two_factor_authentication(): void
    {
        $user = $this->createEnabledUser();

        // Generate the current valid TOTP code.
        $totp = TOTP::createFromSecret(
            self::SECRET,
            new InternalClock,
        );

        $response = $this->actingAs($user)->postJson(
            '/api/two-factor/disable',
            [
                'password' => 'password123',
                'code' => $totp->now(),
            ],
        );

        $response
            ->assertOk()
            ->assertJsonPath('two_factor_enabled', false);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
        ]);
    }

    public function test_user_cannot_disable_two_factor_with_an_incorrect_password(): void
    {
        $user = $this->createEnabledUser();

        $totp = TOTP::createFromSecret(
            self::SECRET,
            new InternalClock,
        );

        $this->actingAs($user)->postJson('/api/two-factor/disable', [
            'password' => 'wrong-password',
            'code' => $totp->now(),
        ])->assertUnprocessable();

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'two_factor_confirmed_at' => $user->two_factor_confirmed_at,
        ]);
    }

    public function test_user_cannot_disable_two_factor_with_an_invalid_totp_code(): void
    {
        $user = $this->createEnabledUser();

        $this->actingAs($user)->postJson('/api/two-factor/disable', [
            'password' => 'password123',
            'code' => '000000',
        ])->assertUnprocessable();

        $this->assertNotNull($user->fresh()->two_factor_confirmed_at);
    }

    public function test_user_cannot_disable_two_factor_when_it_is_not_enabled(): void
    {
        $user = User::factory()->create([
            'password' => 'password123',
        ]);

        $totp = TOTP::createFromSecret(
            self::SECRET,
            new InternalClock,
        );

        $this->actingAs($user)->postJson('/api/two-factor/disable', [
            'password' => 'password123',
            'code' => $totp->now(),
        ])->assertConflict();
    }

    public function test_disabling_two_factor_deletes_all_recovery_codes(): void
    {
        $user = $this->createEnabledUser();

        $user->twoFactorRecoveryCodes()->createMany([
            ['code_hash' => Hash::make('AAAA1111BBBB2222')],
            ['code_hash' => Hash::make('CCCC3333DDDD4444')],
        ]);

        $totp = TOTP::createFromSecret(
            self::SECRET,
            new InternalClock,
        );

        $this->actingAs($user)->postJson('/api/two-factor/disable', [
            'password' => 'password123',
            'code' => $totp->now(),
        ])->assertOk();

        $this->assertDatabaseMissing('two_factor_recovery_codes', [
            'user_id' => $user->id,
        ]);
    }

    public function test_unauthenticated_user_cannot_disable_two_factor(): void
    {
        $this->postJson('/api/two-factor/disable', [
            'password' => 'password123',
            'code' => '123456',
        ])->assertUnauthorized();
    }

    private function createEnabledUser(): User
    {
        return User::factory()->create([
            'password' => 'password123',
            'two_factor_secret' => self::SECRET,
            'two_factor_confirmed_at' => now(),
        ]);
    }
}
