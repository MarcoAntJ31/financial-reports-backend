require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

const transactionSchema = new mongoose.Schema({
    transaccion_id: { type: String, required: true },
    cliente_id: { type: String, required: true },
    cantidad: { type: Number, required: true },
    categoría: { type: String, required: true },
    fecha: { type: Date, required: true },
    tipo: { type: String, required: true },
    estado: { type: String, required: true },
});

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    sequence_value: { type: Number, required: true }
});

const Counter = mongoose.model('Counter', counterSchema);

const getNextTransactionId = async () => {
    const counter = await Counter.findOneAndUpdate(
        { _id: 'transaccion_id' },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
    );
    return counter.sequence_value;
};

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected locally'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

const Transaction = mongoose.model('Transaction', transactionSchema);


app.post('/financial-reports/transactions', async (req, res) => {
    try {
        const nextTransaccionId = await getNextTransactionId();
        const transactionData = { ...req.body, transaccion_id: nextTransaccionId };

        const transaction = new Transaction(transactionData);
        await transaction.save();

        res.status(201).json(transaction);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


app.get('/financial-reports/transactions', async (req, res) => {
    try {
        const { cliente_id, categoría, tipo, estado, fechaInicio, fechaFin } = req.query;
        const filters = {};

        if (cliente_id) {
            filters.cliente_id = cliente_id;
        }

        if (estado) {
            filters.estado = estado;
        }

        if (categoría) {
            filters.categoría = categoría;
        }

        if (tipo) {
            filters.tipo = tipo;
        }

        if (fechaInicio && fechaFin) {
            filters.fecha = {
                $gte: new Date(fechaInicio),
                $lte: new Date(fechaFin),
            };
        }

        const transactions = await Transaction.find(filters).select('-_id -__v');

        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.put('/financial-reports/transactions/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndUpdate(
            { transaccion_id: req.params.id }, 
            req.body,                          
            { new: true }                      
        );

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json(transaction);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


app.delete('/financial-reports/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const report = await Transaction.findOne({ transaccion_id: id });
        if (!report) {
            return res.status(404).json({ message: 'Transacción no encontrada' });
        }

        report.estado = 'desactivada';
        await report.save();

        res.status(200).json({ message: 'Transacción marcada como inactiva.' });
    } catch (error) {
        console.error('Error al marcar como inactiva:', error);
        res.status(500).json({ message: 'Error al procesar la solicitud.' });
    }
});

const ExcelJS = require('exceljs');

app.post('/reports', async (req, res) => {
    try {
        const transactions = await Transaction.find();

        if (transactions.length === 0) {
            return res.status(404).json({ message: 'No se encontraron transacciones activas.' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Transacciones');

        worksheet.columns = [
            { header: 'ID de Transacción', key: 'transaccion_id', width: 20 },
            { header: 'Cliente', key: 'cliente_id', width: 20 },
            { header: 'Categoría', key: 'categoría', width: 20 },
            { header: 'Tipo', key: 'tipo', width: 15 },
            { header: 'Cantidad', key: 'cantidad', width: 10 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Fecha', key: 'fecha', width: 20 },
        ];

        transactions.forEach((transaction) => {
            worksheet.addRow({
                transaccion_id: transaction.transaccion_id,
                cliente_id: transaction.cliente_id,
                categoría: transaction.categoría,
                tipo: transaction.tipo,
                cantidad: transaction.cantidad,
                estado: transaction.estado,
                fecha: transaction.fecha.toISOString().slice(0, 10), 
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
        
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
