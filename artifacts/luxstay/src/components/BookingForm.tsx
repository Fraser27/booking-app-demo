import React, { useState } from 'react';
import { Form, DatePicker, Button, message, Card } from 'antd';
import { createBooking } from '../services/bookingService';
import dayjs from 'dayjs';

interface BookingFormProps {
  propertyId: string;
  pricePerNight: number;
  onBookingSuccess?: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ propertyId, pricePerNight, onBookingSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { dates: [dayjs.Dayjs, dayjs.Dayjs] }) => {
    try {
      setLoading(true);
      const [startDate, endDate] = values.dates;
      const bookingData = {
        propertyId,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD')
      };

      await createBooking(bookingData);
      message.success('Booking created successfully!');
      form.resetFields();
      onBookingSuccess?.();
    } catch (error) {
      message.error('Failed to create booking. Please try again.');
      console.error('Booking error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    if (!dates) return 0;
    const [start, end] = dates;
    const nights = end.diff(start, 'day');
    return nights * pricePerNight;
  };

  return (
    <Card title="Book this property" style={{ maxWidth: 400, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="dates"
          label="Select dates"
          rules={[{ required: true, message: 'Please select your stay dates' }]}
        >
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            disabledDate={(current) => {
              return current && current < dayjs().startOf('day');
            }}
            onChange={(dates) => {
              const totalPrice = calculateTotalPrice(dates);
              form.setFieldsValue({ totalPrice });
            }}
          />
        </Form.Item>

        <Form.Item label="Total Price">
          <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
            ${calculateTotalPrice(form.getFieldValue('dates'))}
          </div>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Book Now
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default BookingForm; 