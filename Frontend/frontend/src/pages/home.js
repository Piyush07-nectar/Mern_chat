import React, { useState, useEffect } from 'react'
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  FormGroup,
  FormLabel,
  FormControl,
  InputGroup,
  Alert,
  ToggleButton,
  ButtonGroup
} from 'react-bootstrap'
import { Eye, EyeSlash } from 'react-bootstrap-icons'
import axios from 'axios'
import './home.css'
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/themeContext';
import ThemeToggle from '../components/ThemeToggle';
// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'

function Home() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if(userInfo){
      navigate('/chat');
    }
  }, [navigate]);
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    pic: '',
    picFile: null
  })

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      
      setFormData({
        ...formData,
        picFile: file,
        pic: previewUrl
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
  
    try {
      if (isLogin) {
        // 🔹 LOGIN request (JSON)
        const response = await axios.post(`${API_BASE_URL}/api/user/login`, {
          email: formData.email,
          password: formData.password,
        });
  
        if (response.data) {
          localStorage.setItem('userInfo', JSON.stringify(response.data));
          setSuccess('Login successful! Redirecting...');
          setTimeout(() => {
            navigate('/chat');
          }, 1500);
        }
      } else {
        // 🔹 SIGNUP request (JSON)
        const response = await axios.post(
          `${API_BASE_URL}/api/user/register`,
          {
            name: formData.name,
            email: formData.email,
            username: formData.username, // optional (your backend doesn’t use yet)
            password: formData.password,
            pic: formData.pic, // send only URL for now
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
  
        if (response.data) {
          // Registration successful - save user info and redirect
          localStorage.setItem('userInfo', JSON.stringify(response.data));
          setSuccess('Registration successful! Redirecting to chat...');
          
          // Clear form data
          setFormData({
            name: '',
            email: '',
            username: '',
            password: '',
            pic: '',
            picFile: null,
          });
          
          // Redirect to chat after successful registration
          setTimeout(() => {
            navigate('/chat');
          }, 1500);
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div 
      className="min-vh-100 home-container d-flex align-items-center"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Theme Toggle - Top Right */}
      <div 
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000
        }}
      >
        <ThemeToggle />
      </div>

      <Container fluid className="px-0">
        <Row className="justify-content-center g-0">
          <Col xs={12} sm={10} md={8} lg={6} xl={5}>
            {/* Mobile Header */}
            <div className="text-center py-4 py-md-5">
              <h1 
                className="talkative-title mb-2 mb-md-3"
                style={{ color: 'var(--text-primary)' }}
              >
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Talkative
                </span>
              </h1>
              <p 
                className="talkative-subtitle"
                style={{ color: 'var(--text-secondary)' }}
              >
                Connect and chat with people around the world
              </p>
            </div>

            <Card 
              className="shadow-lg border-0 form-card"
              style={{
                backgroundColor: 'var(--modal-bg)',
                borderColor: 'var(--border-color)'
              }}
            >
              <Card.Body className="p-3 p-md-4">
                <div className="text-center mb-3 mb-md-4">
                  <ButtonGroup className="mb-3 mb-md-4 toggle-buttons">
                    <ToggleButton
                      id="login-toggle"
                      type="radio"
                      variant="outline-primary"
                      name="mode"
                      value="login"
                      checked={isLogin}
                      onChange={() => setIsLogin(true)}
                      className={isLogin ? 'active' : ''}
                    >
                      Sign In
                    </ToggleButton>
                    <ToggleButton
                      id="signup-toggle"
                      type="radio"
                      variant="outline-primary"
                      name="mode"
                      value="signup"
                      checked={!isLogin}
                      onChange={() => setIsLogin(false)}
                      className={!isLogin ? 'active' : ''}
                    >
                      Sign Up
                    </ToggleButton>
                  </ButtonGroup>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" className="mb-3">
                    {error}
                  </Alert>
                )}

                {/* Success Alert */}
                {success && (
                  <Alert variant="success" className="mb-3">
                    {success}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <div className="d-grid gap-2 gap-md-3">
                    {/* Name field - only for signup */}
                    {!isLogin && (
                      <FormGroup>
                        <FormLabel className="fw-semibold">Full Name</FormLabel>
                        <FormControl
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          size="lg"
                          required
                        />
                      </FormGroup>
                    )}

                    {/* Username field - only for signup */}
                    {!isLogin && (
                      <FormGroup>
                        <FormLabel className="fw-semibold">Username</FormLabel>
                        <FormControl
                          name="username"
                          type="text"
                          value={formData.username}
                          onChange={handleInputChange}
                          placeholder="Choose a username"
                          size="lg"
                          required
                        />
                      </FormGroup>
                    )}

                    {/* Email field */}
                    <FormGroup>
                      <FormLabel className="fw-semibold">Email Address</FormLabel>
                      <FormControl
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        size="lg"
                        required
                      />
                    </FormGroup>

                    {/* Password field */}
                    <FormGroup>
                      <FormLabel className="fw-semibold">Password</FormLabel>
                      <InputGroup size="lg">
                        <FormControl
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Enter your password"
                          required
                        />
                        <Button
                          variant="outline-secondary"
                          onClick={() => setShowPassword(!showPassword)}
                          type="button"
                        >
                          {showPassword ? <EyeSlash /> : <Eye />}
                        </Button>
                      </InputGroup>
                    </FormGroup>

                    {/* Profile Picture field - only for signup */}
                    {!isLogin && (
                      <FormGroup>
                        <FormLabel className="fw-semibold">Profile Picture</FormLabel>
                        
                        {/* File Upload Section */}
                        <div className="file-upload-section mb-3">
                          <FormControl
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="form-control"
                          />
                          <Form.Text className="text-muted mt-2 d-block">
                            📸 Upload from gallery (max 5MB) - JPG, PNG, GIF supported
                          </Form.Text>
                        </div>

                        {/* OR divider */}
                        <div className="or-divider text-center">
                          <small className="text-muted">OR</small>
                        </div>

                        {/* URL Input Section */}
                        <FormControl
                          name="pic"
                          type="url"
                          value={formData.pic}
                          onChange={handleInputChange}
                          placeholder="Enter profile picture URL (optional)"
                          size="lg"
                        />
                        <Form.Text className="text-muted">
                          Enter a direct image URL
                        </Form.Text>

                        {/* Image Preview */}
                        {formData.pic && (
                          <div className="mt-3 text-center">
                            <img
                              src={formData.pic}
                              alt="Profile preview"
                              className="rounded-circle profile-preview"
                              style={{
                                width: '80px',
                                height: '80px',
                                objectFit: 'cover',
                                border: '3px solid #6f42c1'
                              }}
                            />
                            <div className="mt-2">
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => setFormData({
                                  ...formData,
                                  pic: '',
                                  picFile: null
                                })}
                              >
                                🗑️ Remove
                              </Button>
                            </div>
                          </div>
                        )}
                      </FormGroup>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="mt-2 mt-md-3 py-2 py-md-3 fw-semibold"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          {isLogin ? 'Signing In...' : 'Signing Up...'}
                        </>
                      ) : (
                        isLogin ? 'Sign In' : 'Sign Up'
                      )}
                    </Button>
                  </div>
                </Form>

                {/* Demo credentials for login */}
              </Card.Body>
            </Card>

            {/* Footer */}
            <div className="text-center py-3 px-3">
              <small className="footer-text">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </small>
            </div>
          </Col>
        </Row>
      </Container>

    </div>
  )
}

export default Home