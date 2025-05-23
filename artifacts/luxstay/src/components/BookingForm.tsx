import React, { useState } from 'react';
import { Form, DatePicker, Button, message, Card, Input, InputNumber } from 'antd';
import { createBooking } from '../services/bookingService';
import { getCurrentUser } from 'aws-amplify/auth';
import dayjs from 'dayjs';
import '../styles/LuxstayTheme.css';

interface BookingFormProps {
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  pricePerNight: number;
  onBookingSuccess?: () => void;
}

interface GuestDetails {
  name: string;
  email: string;
  phone: string;
  adults: number;
  children: number;
}

const BookingForm: React.FC<BookingFormProps> = ({ propertyId, propertyTitle, propertyLocation, pricePerNight, onBookingSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  const handleSubmit = async (values: { 
    dates: [dayjs.Dayjs, dayjs.Dayjs];
    guestDetails: GuestDetails;
  }) => {
    try {
      setLoading(true);
      const [startDate, endDate] = values.dates;
      const user = await getCurrentUser();
      
      const bookingData = {
        property_id: propertyId,
        user_id: user.username,
        check_in: startDate.startOf('day').unix(), // Convert to epoch time
        check_out: endDate.startOf('day').unix(), // Convert to epoch time
        guest_details: values.guestDetails,
        total_price: calculateTotalPrice(values.dates),
        name: values.guestDetails.name,
        email: values.guestDetails.email,
        phone: values.guestDetails.phone,
        guests: values.guestDetails.adults + values.guestDetails.children,
        property_title: propertyTitle,
        property_location: propertyLocation
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
    <Card title="Book this property" style={{ maxWidth: '40%', marginRight: '10%' }}>
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
              if (dates) {
                form.setFieldsValue({ dates });
                const totalPrice = calculateTotalPrice(dates);
                setTotalPrice(totalPrice);
                form.setFieldsValue({ totalPrice });
              }
            }}
          />
        </Form.Item>

        <Form.Item label="Total Price">
          <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
            {totalPrice}
          </div>
        </Form.Item>

        <Form.Item
          name={['guestDetails', 'name']}
          label="Full Name"
          rules={[{ required: true, message: 'Please enter your name' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name={['guestDetails', 'email']}
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name={['guestDetails', 'phone']}
          label="Phone Number"
          rules={[{ required: true, message: 'Please enter your phone number' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name={['guestDetails', 'adults']}
          label="Number of Adults"
          rules={[{ required: true, message: 'Please enter number of adults' }]}
        >
          <InputNumber min={1} max={10} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name={['guestDetails', 'children']}
          label="Number of Children"
        >
          <InputNumber min={0} max={10} style={{ width: '100%' }} />
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