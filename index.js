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

app.post('/reports', async (req, res) => {
    const { startDate, endDate, client, category } = req.body;
    try {
        const query = {
            ...(startDate && endDate && { date: { $gte: new Date(startDate), $lte: new Date(endDate) } }),
            ...(client && { client }),
            ...(category && { category }),
            isActive: true
        };

        const transactions = await Transaction.find(query);
        res.json({ transactions, message: 'Report generated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/metrics', async (req, res) => {
    try {
        const totalTransactions = await Transaction.countDocuments({ isActive: true });
        const totalAmount = await Transaction.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        res.json({
            totalTransactions,
            totalAmount: totalAmount[0]?.total || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
