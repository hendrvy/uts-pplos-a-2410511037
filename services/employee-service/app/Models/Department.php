<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $fillable = ['nama_departemen'];

    public function positions()
    {
        return $this->hasMany(Position::class);
    }
}