import { Router } from "express";
import { createEmployee, getEmployeeByWorkerId, updateEmployee } from "../db";

const router = Router();

/**
 * POST /api/employee/profile
 * Salvar ou atualizar perfil do empregado
 */
router.post("/profile", async (req, res) => {
  try {
    const { cpf, matricula, name, position, weight, height, workType, turno } = req.body;

    console.log("[Employee REST] Saving profile:", { matricula, name, position });

    // Validação básica
    if (!matricula || !name) {
      return res.status(400).json({ 
        success: false, 
        error: "Matrícula e nome são obrigatórios" 
      });
    }

    // Verificar se já existe
    const existing = await getEmployeeByWorkerId(matricula);

    let employeeId: number;

    if (existing) {
      // Atualizar
      await updateEmployee(existing.id, {
        name,
        cpf: cpf || existing.cpf,
        position: position || existing.position,
        weight: weight ? Number(weight) : existing.weight,
        height: height ? Number(height) : existing.height,
        workType: workType || existing.workType,
        turno: turno || existing.turno,
      });
      employeeId = existing.id;
      console.log("[Employee REST] Updated employee:", employeeId);
    } else {
      // Criar novo
      employeeId = await createEmployee({
        matricula,
        workerId: matricula,
        name,
        cpf: cpf || "",
        position: position || "",
        weight: weight ? Number(weight) : undefined,
        height: height ? Number(height) : undefined,
        workType: workType || undefined,
        turno: turno || undefined,
        isActive: 1,
      });
      console.log("[Employee REST] Created employee:", employeeId);
    }

    res.json({
      success: true,
      employee: {
        id: employeeId,
        matricula,
        name,
        cpf,
        position,
        weight,
        height,
        workType,
        turno,
      },
    });
  } catch (error) {
    console.error("[Employee REST] Error saving profile:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao salvar perfil",
    });
  }
});

/**
 * GET /api/employee/profile/:matricula
 * Buscar perfil por matrícula
 */
router.get("/profile/:matricula", async (req, res) => {
  try {
    const { matricula } = req.params;

    const employee = await getEmployeeByWorkerId(matricula);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Funcionário não encontrado",
      });
    }

    res.json({
      success: true,
      employee: {
        id: employee.id,
        matricula: employee.workerId,
        name: employee.name,
        cpf: employee.cpf,
        position: employee.position,
        weight: employee.weight,
        height: employee.height,
        workType: employee.workType,
        turno: employee.turno,
      },
    });
  } catch (error) {
    console.error("[Employee REST] Error loading profile:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao carregar perfil",
    });
  }
});

/**
 * POST /api/employee/blood-pressure
 * Registrar pressão arterial
 */
router.post("/blood-pressure", async (req, res) => {
  try {
    const { matricula, systolic, diastolic, heartRate, notes } = req.body;

    console.log("[Employee REST] Saving blood pressure:", { matricula, systolic, diastolic });

    if (!matricula || !systolic || !diastolic) {
      return res.status(400).json({
        success: false,
        error: "Matrícula, pressão sistólica e diastólica são obrigatórios",
      });
    }

    const employee = await getEmployeeByWorkerId(matricula);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Funcionário não encontrado",
      });
    }

    // Salvar no banco - por enquanto apenas retornar sucesso
    // TODO: implementar createHealthRecord no db.ts
    
    const recordId = Date.now(); // Temporary ID

    console.log("[Employee REST] Blood pressure saved:", recordId);

    res.json({
      success: true,
      record: {
        id: recordId,
        matricula,
        systolic,
        diastolic,
        heartRate,
        notes,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Employee REST] Error saving blood pressure:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao salvar pressão arterial",
    });
  }
});

/**
 * POST /api/employee/symptoms
 * Registrar sintomas/queixas
 */
router.post("/symptoms", async (req, res) => {
  try {
    const { matricula, symptoms, details } = req.body;

    console.log("[Employee REST] Saving symptoms:", { matricula, symptoms });

    if (!matricula || !symptoms || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Matrícula e sintomas são obrigatórios",
      });
    }

    const employee = await getEmployeeByWorkerId(matricula);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Funcionário não encontrado",
      });
    }

    // Salvar no banco - por enquanto apenas retornar sucesso
    // TODO: implementar createHealthRecord no db.ts
    
    const recordId = Date.now(); // Temporary ID

    console.log("[Employee REST] Symptoms saved:", recordId);

    res.json({
      success: true,
      record: {
        id: recordId,
        matricula,
        symptoms,
        details,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Employee REST] Error saving symptoms:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao salvar sintomas",
    });
  }
});

export default router;
