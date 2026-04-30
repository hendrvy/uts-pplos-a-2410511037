<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    // GET /api/employees (Menampilkan data dengan Paging & Filtering)
    public function index(Request $request)
    {
        $query = Employee::with('position.department');

        // Fitur Filtering berdasarkan Nama Departemen
        if ($request->has('department')) {
            $query->whereHas('position.department', function($q) use ($request) {
                $q->where('nama_departemen', $request->department);
            });
        }

        // Fitur Paging (default 10 per halaman)
        $perPage = $request->input('per_page', 10);
        $employees = $query->paginate($perPage);

        return response()->json($employees, 200);
    }

    // POST /api/employees (Menambah data dengan Validasi)
    public function store(Request $request)
    {
        // Validasi Input (Layer Request)
        $validatedData = $request->validate([
            'user_id' => 'required|integer',
            'position_id' => 'required|exists:positions,id',
            'nip' => 'required|string|unique:employees,nip',
            'nama_lengkap' => 'required|string|max:255',
        ]);

        $employee = Employee::create($validatedData);

        return response()->json([
            'message' => 'Data pegawai berhasil ditambahkan',
            'data' => $employee
        ], 201); // HTTP Response Code 201 (Created)
    }
}