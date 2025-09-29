import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Button,
  Alert,
  Spinner,
  InputGroup
} from 'react-bootstrap';
import { Envelope, ArrowLeft, Clock } from 'react-bootstrap-icons';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const EmailVerification = ({ 
  show, 
  onHide, 
  email, 
  onVerificationSuccess,
  onBackToRegister 
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVerificationCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setVerificationCode(value);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get registration data from localStorage
      const registrationData = JSON.parse(localStorage.getItem('pendingRegistration') || '{}');
      
      const response = await axios.post(`${API_BASE_URL}/api/user/verify-email`, {
        email,
        verificationCode,
        name: registrationData.name,
        password: registrationData.password,
        pic: registrationData.pic || ''
      });

      console.log('✅ Email verification successful:', response.data);
      
      // Save user data to localStorage
      localStorage.setItem('userInfo', JSON.stringify(response.data.user));
      localStorage.removeItem('pendingRegistration'); // Clean up
      
      setSuccess(response.data.message);
      
      // Call success callback after a short delay
      setTimeout(() => {
        onVerificationSuccess(response.data.user);
      }, 2000);

    } catch (error) {
      console.error('❌ Email verification error:', error);
      setError(error.response?.data?.message || 'Verification failed. Please try again.');
      
      // Update attempts left if provided
      if (error.response?.data?.attemptsLeft !== undefined) {
        setAttemptsLeft(error.response.data.attemptsLeft);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/resend-verification`, {
        email
      });

      console.log('✅ Verification code resent:', response.data);
      setSuccess('New verification code sent to your email!');
      setTimeLeft(15 * 60); // Reset timer
      setAttemptsLeft(3); // Reset attempts
      setVerificationCode(''); // Clear input

    } catch (error) {
      console.error('❌ Resend verification error:', error);
      setError(error.response?.data?.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRegister = () => {
    localStorage.removeItem('pendingRegistration');
    onBackToRegister();
  };

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <Envelope className="me-2" />
          Email Verification
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <div className="text-center mb-4">
          <div className="mb-3">
            <Envelope size={48} className="text-primary" />
          </div>
          <h5>Check your email</h5>
          <p className="text-muted">
            We've sent a 6-digit verification code to:
            <br />
            <strong>{email}</strong>
          </p>
          
          {/* Development mode notice */}
          {process.env.NODE_ENV === 'development' && (
            <Alert variant="info" className="mt-3">
              <small>
                <strong>Development Mode:</strong> If email is not configured, 
                check the server console for the verification code.
              </small>
            </Alert>
          )}
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Form onSubmit={handleVerifyEmail}>
          <Form.Group className="mb-3">
            <Form.Label>Verification Code</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={handleVerificationCodeChange}
                maxLength={6}
                style={{
                  fontSize: '24px',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontFamily: 'monospace'
                }}
                disabled={loading}
              />
            </InputGroup>
            <Form.Text className="text-muted">
              Enter the 6-digit code sent to your email
            </Form.Text>
          </Form.Group>

          {/* Timer and attempts info */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                <Clock className="me-1" />
                Code expires in: <strong>{formatTime(timeLeft)}</strong>
              </small>
              <small className="text-muted">
                Attempts left: <strong>{attemptsLeft}</strong>
              </small>
            </div>
          </div>

          <div className="d-grid gap-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || verificationCode.length !== 6 || timeLeft === 0}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>

            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                onClick={handleBackToRegister}
                disabled={loading}
                className="flex-fill"
              >
                <ArrowLeft className="me-1" />
                Back to Register
              </Button>
              
              <Button
                variant="outline-primary"
                onClick={handleResendCode}
                disabled={loading || timeLeft > 0}
                className="flex-fill"
              >
                Resend Code
              </Button>
            </div>
          </div>
        </Form>

        {timeLeft === 0 && (
          <Alert variant="warning" className="mt-3">
            <strong>Code Expired!</strong> Click "Resend Code" to get a new verification code.
          </Alert>
        )}

        {attemptsLeft === 0 && (
          <Alert variant="danger" className="mt-3">
            <strong>Too many failed attempts!</strong> Please go back to registration and try again.
          </Alert>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default EmailVerification;
