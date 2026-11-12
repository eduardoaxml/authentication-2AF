<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TwoFactorRecoveryCodesTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_generate_recovery_codes(): void
    {
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);

        $response = $this->actingAs($user, 'web')
            ->postJson('/api/two-factor/recovery-codes/regenerate', [
                'password' => 'password',
            ]);

        $response
            ->assertOk()
            ->assertJsonCount(10, 'recovery_codes');

        $codes = $response->json('recovery_codes');

        $this->assertCount(10, array_unique($codes));

        $this->assertDatabaseCount('two_factor_recovery_codes', 10);

        foreach ($codes as $code) {
            $this->assertDatabaseMissing('two_factor_recovery_codes', [
                'code_hash' => $code,
            ]);
        }
    }

    public function test_recovery_codes_are_stored_as_hashes(): void
    {
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);

        $response = $this->actingAs($user, 'web')
            ->postJson('/api/two-factor/recovery-codes/regenerate', [
                'password' => 'password',
            ]);

        $codes = $response->json('recovery_codes');

        $storedCodes = $user->twoFactorRecoveryCodes()->get();

        $this->assertCount(10, $storedCodes);

        foreach ($codes as $code) {
            $this->assertTrue(
                $storedCodes->contains(
                    fn ($recoveryCode): bool => Hash::check(
                        str_replace('-', '', $code),
                        $recoveryCode->code_hash,
                    ),
                ),
            );
        }
    }

    public function test_regenerating_codes_invalidates_previous_codes(): void
    {
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);

        $this->actingAs($user, 'web');

        $firstResponse = $this->postJson(
            '/api/two-factor/recovery-codes/regenerate',
            ['password' => 'password'],
        );

        $firstCodes = $firstResponse->json('recovery_codes');

        $secondResponse = $this->postJson(
            '/api/two-factor/recovery-codes/regenerate',
            ['password' => 'password'],
        );

        $secondResponse->assertOk();

        $this->assertDatabaseCount('two_factor_recovery_codes', 10);

        $this->assertNotContains(
            $firstCodes[0],
            $secondResponse->json('recovery_codes'),
        );
    }

    public function test_user_cannot_generate_codes_without_enabled_two_factor(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web')
            ->postJson('/api/two-factor/recovery-codes/regenerate', [
                'password' => 'password',
            ])
            ->assertConflict();

        $this->assertDatabaseCount('two_factor_recovery_codes', 0);
    }

    public function test_user_must_provide_current_password(): void
    {
        $user = User::factory()->create([
            'two_factor_confirmed_at' => now(),
        ]);

        $this->actingAs($user, 'web')
            ->postJson('/api/two-factor/recovery-codes/regenerate', [
                'password' => 'wrong-password',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    public function test_unauthenticated_user_cannot_generate_codes(): void
    {
        $this->postJson('/api/two-factor/recovery-codes/regenerate', [
            'password' => 'password',
        ])->assertUnauthorized();
    }
}
