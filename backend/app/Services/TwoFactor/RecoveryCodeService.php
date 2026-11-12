<?php

namespace App\Services\TwoFactor;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RecoveryCodeService
{
    private const CODE_COUNT = 10;

    public function regenerate(User $user): array
    {
        return DB::transaction(function () use ($user): array {
            $lockedUser = User::query()
                ->lockForUpdate()
                ->findOrFail($user->getKey());

            $lockedUser->twoFactorRecoveryCodes()->delete();

            $plainTextCodes = [];

            for ($i = 0; $i < self::CODE_COUNT; $i++) {
                $code = $this->generateCode();

                $plainTextCodes[] = $code;

                $lockedUser->twoFactorRecoveryCodes()->create([
                    'code_hash' => Hash::make($this->normalizeCode($code)),
                ]);
            }

            return $plainTextCodes;
        });
    }

    public function consume(User $user, string $code): bool
    {
        return DB::transaction(function () use ($user, $code): bool {
            $lockedUser = User::query()
                ->lockForUpdate()
                ->findOrFail($user->getKey());

            $recoveryCodes = $lockedUser->twoFactorRecoveryCodes()
                ->whereNull('used_at')
                ->lockForUpdate()
                ->get();

            foreach ($recoveryCodes as $recoveryCode) {
                if (! Hash::check($this->normalizeCode($code), $recoveryCode->code_hash)) {
                    continue;
                }

                $recoveryCode->update([
                    'used_at' => now(),
                ]);

                return true;
            }

            return false;
        });
    }

    private function generateCode(): string
    {
        $randomCode = strtoupper(bin2hex(random_bytes(8)));

        return implode('-', str_split($randomCode, 4));
    }

    private function normalizeCode(string $code): string
    {
        return strtoupper(str_replace('-', '', trim($code)));
    }
}
