<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TwoFactorSetupTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_start_two_factor_setup(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'web')
            ->postJson('/api/two-factor/setup');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'message',
                'secret',
                'qr_code',
            ]);

        $this->assertNotNull($user->fresh()->two_factor_secret);
        $this->assertNull($user->fresh()->two_factor_confirmed_at);
    }

    public function test_two_factor_secret_is_encrypted_in_database(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web')
            ->postJson('/api/two-factor/setup')
            ->assertOk();

        $storedSecret = $user->fresh()->getRawOriginal('two_factor_secret');

        $this->assertNotNull($storedSecret);

        $this->assertNotSame(
            $user->fresh()->two_factor_secret,
            $storedSecret,
        );
    }

    public function test_repeated_setup_requests_reuse_unconfirmed_secret(): void
    {
        $user = User::factory()->create();

        $firstResponse = $this->actingAs($user, 'web')
            ->postJson('/api/two-factor/setup');

        $firstSecret = $firstResponse->json('secret');

        $secondResponse = $this->postJson('/api/two-factor/setup');

        $secondResponse
            ->assertOk()
            ->assertJsonPath('secret', $firstSecret);
    }

    public function test_user_cannot_restart_setup_when_two_factor_is_enabled(): void
    {
        $user = User::factory()->create([
            'two_factor_secret' => 'JBSWY3DPEHPK3PXP',
            'two_factor_confirmed_at' => now(),
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/two-factor/setup')
            ->assertConflict();

        $this->assertSame(
            'JBSWY3DPEHPK3PXP',
            $user->fresh()->two_factor_secret,
        );
    }

    public function test_unauthenticated_user_cannot_start_setup(): void
    {
        $this->postJson('/api/two-factor/setup')
            ->assertUnauthorized();
    }
}
