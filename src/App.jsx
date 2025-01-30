import React, { useState, useEffect } from 'react';
import { Layout, Form, Input, Button, Table, Modal, notification, InputNumber } from 'antd';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { motion } from "framer-motion";

const { Content } = Layout;

const apiUrl = import.meta.env.VITE_API_URL;
const App = () => {
  const [debts, setDebts] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const navigate = useNavigate();

  // Загрузка долгов с сервера
  const loadDebts = async () => {
    try {
      const response = await axios.get(apiUrl);
      setDebts(response.data);
    } catch (error) {
      notification.error({
        message: 'Ошибка загрузки долгов',
        description: 'Не удалось загрузить данные о долгах.',
      });
    }
  };

  useEffect(() => {
    loadDebts();
  }, []);

  // Функция для добавления нового долга
  const addDebt = async (name, totalDebt) => {
    try {
      const newDebt = {
        name,
        totalDebt,
        remainingDebt: totalDebt,
        payments: [],
      };
      const response = await axios.post(apiUrl, newDebt);
      setDebts([...debts, response.data]);
      notification.success({
        message: 'Долг добавлен',
        description: `Долг для ${name} на сумму ${totalDebt} был добавлен.`,
      });
    } catch (error) {
      notification.error({
        message: 'Ошибка добавления долга',
        description: 'Не удалось добавить долг на сервер.',
      });
    }
  };

  return (
    <Layout>
        <div className="logo" />
        <h2 >Учет долгов</h2>
      <Content style={{ padding: '10px' }}>
      <Button type="primary" onClick={() => setIsFormVisible(!isFormVisible)}>
      {isFormVisible ? 'Скрыть форму' : 'Добавить долг'}
        </Button>
        <motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ 
    height: isFormVisible ? 'auto' : 0, 
    opacity: isFormVisible ? 1 : 0 
  }}
  transition={{ duration: 0.6, ease: "easeInOut" }} // <-- настройка скорости
  style={{ overflow: 'hidden' }}
>
  <DebtForm addDebt={addDebt} />
</motion.div>

        <Table
          columns={[
            {
              title: 'Имя',
              dataIndex: 'name',
              key: 'name',
              render: (text, record) => (
                <Button type="link" onClick={() => navigate(`/debt/${record.id}`)}>
                  {text}
                </Button>
              ),
            },
            {
              title: 'Сумма долга',
              dataIndex: 'totalDebt',
              key: 'totalDebt',
            },
            {
              title: 'Остаток долга',
              dataIndex: 'remainingDebt',
              key: 'remainingDebt',
            },
          ]}
          dataSource={debts}
          rowKey="id"
          style={{ marginTop: 20 }}
        />
      </Content>
    </Layout>
  );
};

// Компонент для отображения истории погашений
const DebtHistory = () => {
  const { debtId } = useParams(); // Получаем ID долга из маршрута
  const [debt, setDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [increaseAmount, setIncreaseAmount] = useState(0); // Состояние для увеличения долга
  const [isIncreaseVisible, setIsIncreaseVisible] = useState(false); // Состояние видимости блока для увеличения долга

  const navigate = useNavigate();
  
  // Загрузка данных о долге по его ID
  useEffect(() => {
    const loadDebt = async () => {
      try {
        const response = await axios.get(`${apiUrl}/${debtId}`);
        setDebt(response.data);
      } catch (error) {
        notification.error({
          message: 'Ошибка загрузки долга',
          description: 'Не удалось загрузить данные о долге.',
        });
      }
    };
    loadDebt();
  }, [debtId]);

  // Функция для добавления частичного платежа
  const addPayment = async () => {
    if (paymentAmount <= 0 || !debt) return;

    if (paymentAmount > debt.remainingDebt) {
      notification.error({ message: 'Ошибка', description: 'Сумма платежа больше остатка долга!' });
      return;
    }

    const updatedDebt = {
      ...debt,
      remainingDebt: debt.remainingDebt - paymentAmount,
      payments: [...debt.payments, { amount: paymentAmount, date: new Date(), type: 'payment' }],
    };

    try {
      await axios.patch(`${apiUrl}/${debt.id}`, updatedDebt);
      setDebt(updatedDebt);
      notification.success({
        message: 'Платеж принят',
        description: `Вы погасили ${paymentAmount} из долга.`,
      });
    } catch (error) {
      notification.error({
        message: 'Ошибка обновления долга',
        description: 'Не удалось обновить долг на сервере.',
      });
    }
  };

  // Функция для увеличения долга
  const increaseDebt = async () => {
    if (increaseAmount <= 0 || !debt) return;

    const updatedDebt = {
      ...debt,
      totalDebt: debt.totalDebt + increaseAmount, // Увеличиваем общую сумму долга
      remainingDebt: debt.remainingDebt + increaseAmount, // Увеличиваем остаток долга
      payments: [...debt.payments, { amount: increaseAmount, date: new Date(), type: 'increase' }], // Добавляем запись об увеличении
    };

    try {
      await axios.patch(`${apiUrl}/${debt.id}`, updatedDebt);
      setDebt(updatedDebt);
      notification.success({
        message: 'Долг увеличен',
        description: `Сумма долга увеличена на ${increaseAmount}. Новый долг: ${updatedDebt.totalDebt}`,
      });
    } catch (error) {
      notification.error({
        message: 'Ошибка увеличения долга',
        description: 'Не удалось обновить долг на сервере.',
      });
    }
  };

  // Функция для переключения видимости блока с увеличением долга
  const toggleIncreaseDebt = () => {
    setIsIncreaseVisible(!isIncreaseVisible);
  };

  if (!debt) return <div>Загрузка...</div>;

  return (
    <Layout>
      <Button style={{ width: '100px', color: '#1677ff' }} size='large' fill="none" onClick={() => navigate(-1)}>
        <ArrowLeftOutlined /> Назад
      </Button>
      <div className="logo" />
      <h2>История погашения долга {debt.name}</h2>
      <Content style={{ padding: '10px' }}>
        <h3>Остаток долга: {debt.remainingDebt}</h3>
        <InputNumber
          min={0}
          value={paymentAmount === 0 ? '' : paymentAmount}
          onChange={(value) => setPaymentAmount(value)}
          style={{ width: '100px', marginRight: 10 }}
        />
        <Button type="primary" onClick={addPayment} style={{ marginTop: 10 }}>
          Погасить долг
        </Button>
        
        <Button 
          type="link" 
          onClick={toggleIncreaseDebt} 
          style={{ marginTop: 10, color: '#1677ff' }}
        >
          {isIncreaseVisible ? 'Скрыть' : 'Увеличить долг'}
        </Button>

        <motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ 
    height: isIncreaseVisible ? 'auto' : 0, 
    opacity: isIncreaseVisible ? 1 : 0 
  }}
  transition={{ duration: 0.6, ease: "easeInOut" }} // <-- настройка скорости
  style={{ overflow: 'hidden' }}
>
          <div className="increase-debt-container" style={{ marginTop: 20 }}>
            <h3>Увеличить долг:</h3>
            <InputNumber
              min={0}
              value={increaseAmount === 0 ? '' : increaseAmount}
              onChange={(value) => setIncreaseAmount(value)}
              style={{ width: '100px', marginRight: 10 }}
            />
            <Button type="primary" onClick={increaseDebt} style={{ marginTop: 10 }}>
              Увеличить долг
            </Button>
          </div>
          </motion.div>

        <Table
          columns={[
            { title: 'Дата', dataIndex: 'date', key: 'date' },
            { title: 'Сумма', dataIndex: 'amount', key: 'amount' },
            { title: 'Тип', dataIndex: 'type', key: 'type' },
          ]}
          dataSource={debt.payments.map((payment, index) => ({
            key: index,
            date: new Date(payment.date).toLocaleString(),  // Преобразуем дату в строку
            amount: payment.amount,
            type: payment.type === 'increase' ? 'Увеличение' : 'Платеж',
          }))}
          rowKey="key"
          style={{ marginTop: 20 }}
        />
      </Content>
    </Layout>
  );
};

// Компонент для добавления долга
const DebtForm = ({ addDebt }) => {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    addDebt(values.name, values.totalDebt);
    form.resetFields();
  };

  return (
    <Form form={form} onFinish={onFinish}>
      <Form.Item
        label="Имя"
        name="name"
        rules={[{ required: true, message: 'Пожалуйста, введите имя!' }]}
      >
        <Input style={{ width: '250px' }}/>
      </Form.Item>
      <Form.Item
        label="Сумма долга"
        name="totalDebt"
        rules={[{ required: true, message: 'Пожалуйста, введите сумму долга!' }]}
      >
        <InputNumber min={0} style={{ width: '100px' }} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Добавить долг
        </Button>
      </Form.Item>
    </Form>
  );
};

export default function RouterApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/debt/:debtId" element={<DebtHistory />} />
      </Routes>
    </Router>
  );
}
