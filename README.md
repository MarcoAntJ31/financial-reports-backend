Financial Reports API
Este es el backend de la aplicación Financial Reports Evaluation, una API REST que permite gestionar transacciones financieras con características como CRUD, filtrado avanzado y exportación de reportes en Excel.

Requisitos previos
Asegúrate de tener instalado lo siguiente antes de comenzar:

Node.js (versión 16 o superior) – Descargar Node.js
MongoDB (puedes usar una instancia local o un servicio en la nube como MongoDB Atlas)
Un editor de texto o IDE como Visual Studio Code
Instrucciones de instalación
Clona el repositorio:

Abre tu terminal y ejecuta:

git clone https://github.com/MarcoAntJ31/financial-reports-backend.git
cd financial-reports-api
Instala las dependencias:

Ejecuta el siguiente comando para instalar las dependencias necesarias:

npm install
Configura las variables de entorno:

Crea un archivo .env en la raíz del proyecto y define las siguientes variables:


PORT=4000
MONGO_URI=mongodb://localhost:27017/financialDB

PORT: 4000.
MONGO_URI=mongodb://localhost:27017/financialDB

Cómo ejecutar el proyecto
Inicia el servidor:

Usa el siguiente comando para iniciar el servidor:

npm start
El servidor se ejecutará en http://localhost:4000 por defecto.

Modo desarrollo:

Si prefieres trabajar en un entorno de desarrollo con recarga automática, usa:

npm run dev
Endpoints de la API
Transacciones
Crear una nueva transacción
POST /financial-reports/transactions

Cuerpo del request:

{
  "cliente_id": "12345",
  "cantidad": 500,
  "categoría": "Alimentos",
  "fecha": "2025-01-01",
  "tipo": "Ingreso",
  "estado": "activo"
}
Listar transacciones
GET /financial-reports/transactions

Parámetros opcionales para filtrar (query):

cliente_id
categoría
tipo
estado
fechaInicio y fechaFin
Actualizar una transacción
PUT /financial-reports/transactions/:id

Cuerpo del request:

{
  "cantidad": 600,
  "estado": "actualizado"
}
Desactivar una transacción
DELETE /financial-reports/:id

Cambia el estado de la transacción a desactivada.

Reportes
Exportar transacciones a Excel
POST /reports

Descarga un archivo report.xlsx con todas las transacciones.

Dependencias principales
Express: Framework para construir la API REST
MongoDB & Mongoose: Base de datos NoSQL y ODM para modelar datos
Cors: Para habilitar solicitudes desde diferentes dominios
ExcelJS: Generación de reportes en formato Excel
dotenv: Para gestionar variables de entorno
Estructura del proyecto
El backend tiene la siguiente estructura:

bash
Copiar
Editar
financial-reports-api/
├── .env               # Variables de entorno
├── server.js          # Archivo principal del servidor
├── package.json       # Dependencias y scripts del proyecto
└── node_modules/      # Módulos instalados
Ejemplo de uso
Crear transacciones: Envía un POST a /financial-reports/transactions con los datos necesarios.
Filtrar transacciones: Usa parámetros como cliente_id, categoría o un rango de fechas para buscar transacciones.
Exportar reportes: Envía un POST a /reports para descargar un archivo Excel con todas las transacciones.


Se adjunta script_mongo para crear la bd en mongo en conjunto con algunos datos

