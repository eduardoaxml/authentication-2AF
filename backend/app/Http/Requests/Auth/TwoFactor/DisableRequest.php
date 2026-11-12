<?php

namespace App\Http\Requests\Auth\TwoFactor;

use Illuminate\Foundation\Http\FormRequest;

class DisableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'password' => [
                'required',
                'string',
                'current_password:web',
            ],
            'code' => [
                'required',
                'string',
                'digits:6',
            ],
        ];
    }
}
