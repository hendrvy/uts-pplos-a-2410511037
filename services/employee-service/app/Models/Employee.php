<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = ['user_id', 'position_id', 'nip', 'nama_lengkap'];

    public function position()
    {
        return $this->belongsTo(Position::class);
    }
}