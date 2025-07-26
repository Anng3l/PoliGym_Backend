import mongoose, { mongo } from "mongoose";

// Esquema de Ejercicios
const exerciseSchema = new mongoose.Schema({
  name: { type: String, require: false },
  series: { type: Number, require: false },
  repetitions: { type: Number, require: false },
  measure: { type: String, require: false }
});

// Esquema de Rutinas
const routineSchema = new mongoose.Schema(
  {
    idUserRutina: { type: mongoose.Schema.Types.ObjectId, require: true, ref: "User" },
    name: { type: String, require: true },
    description: { type: String, require: false },
    exercises: { type: [exerciseSchema], require: false, default: [] }
  },
  {
    timestamps: true, // Agrega automáticamente createdAt y updatedAt
  }
);

// Crear el modelo
const Routine = mongoose.model("Routine", routineSchema);

export default Routine;