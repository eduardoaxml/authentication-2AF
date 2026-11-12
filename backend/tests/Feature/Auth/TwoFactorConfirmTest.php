<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use OTPHP\InternalClock;
use OTPHP\TOTP;
use Tests\TestCase;

class TwoFactorConfirmTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_enable_two_factor_with_valid_code(): void
    {
        $user = User::factory()->create([
            'two_factor_secret' => 'JBSWY3DPEHPK3PXP',
        ]);

        $code = TOTP::createFromSecret(
            'JBSWY3DPEHPK3PXP',
            new InternalClock(),
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
    }

    public function test_user_cannot_enable_two_factor_with_invalid_code(): void
    {
        $user = User::factory()->create([
            'two_factor_secret' => 'JBSWY3DPEHPK3PXP',
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
            'two_factor_secret' => 'JBSWY3DPEHPK3PXP',
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
            'two_factor_secret' => 'JBSWY3DPEHPK3PXP',
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
}
