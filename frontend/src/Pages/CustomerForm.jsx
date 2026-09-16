import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { API_URL } from "../config";


function CustomerForm() {
  const { accessToken, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { customerId } = useParams();

  const isEditMode = Boolean(customerId);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    customer_code: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
  });

  useEffect(() => {
    if (!isEditMode || !accessToken) {
      setLoading(false);
      return;
    }

    const fetchCustomer = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/customers/${customerId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Failed to fetch customer: ${response.status} ${text}`
          );
        }

        const customer = await response.json();

        setFormData({
          customer_code: customer.customer_code || "",
          name: customer.name || "",
          email: customer.email || "",
          phone: customer.phone || "",
          address: customer.address || "",
          city: customer.city || "",
          country: customer.country || "",
        });
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [accessToken, customerId, isEditMode]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const createCustomer = async () => {
    const payload = {
      customer_code: formData.customer_code.trim(),
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      country: formData.country.trim() || null,
    };

    const response = await fetch(`${API_URL}/customers/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Failed to create customer: ${response.status} ${text}`
      );
    }

    return response.json();
  };

  const updateCustomer = async () => {
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      country: formData.country.trim() || null,
    };

    const response = await fetch(`${API_URL}/customers/${customerId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Failed to update customer: ${response.status} ${text}`
      );
    }

    return response.json();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!accessToken) {
      setError("You are not logged in.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (isEditMode) {
        await updateCustomer();
      } else {
        await createCustomer();
      }

      navigate("/customers", { replace: true });
    } catch (err) {
      console.error("Customer save failed:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/customers");
  };

  if (!isAuthenticated) {
    return (
      <div className="customer-form-page">
        <div className="customer-form-state">
          <div className="customer-form-state-icon">!</div>
          <strong>Authentication required</strong>
          <p>Please login first.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="customer-form-page">
        <div className="customer-form-state">
          <div className="customer-form-spinner" />
          <strong>Loading customer...</strong>
          <p>Please wait while the customer information is loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-form-page">
      <style>{`
        .customer-form-page {
          --cf-text: #172033;
          --cf-muted: #667085;
          --cf-border: #e5e7eb;
          --cf-border-soft: #eef0f3;
          --cf-surface: #ffffff;
          --cf-surface-soft: #f8fafc;
          --cf-primary: #2563eb;
          --cf-primary-dark: #1d4ed8;
          --cf-shadow: 0 12px 32px rgba(15, 23, 42, 0.07);
          min-height: 100%;
          color: var(--cf-text);
        }

        .customer-form-page * {
          box-sizing: border-box;
        }

        .customer-form-page .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 24px;
        }

        .customer-form-page .admin-page-kicker {
          display: inline-block;
          margin-bottom: 7px;
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .customer-form-page .page-header h2 {
          margin: 0;
          font-size: 28px;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .customer-form-page .page-header p {
          margin: 8px 0 0;
          color: var(--cf-muted);
          font-size: 14px;
        }

        .customer-form-page .form-card {
          overflow: hidden;
          border: 1px solid var(--cf-border);
          border-radius: 16px;
          background: var(--cf-surface);
          box-shadow: var(--cf-shadow);
        }

        .customer-form-page .form-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 22px 24px;
          border-bottom: 1px solid var(--cf-border-soft);
          background: linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%);
        }

        .customer-form-page .form-header-icon {
          display: grid;
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          place-items: center;
          border: 1px solid #dbe7ff;
          border-radius: 12px;
          background: #eef4ff;
          color: var(--cf-primary);
          font-size: 19px;
          font-weight: 800;
        }

        .customer-form-page .form-header h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
        }

        .customer-form-page .form-header p {
          margin: 5px 0 0;
          color: var(--cf-muted);
          font-size: 13px;
        }

        .customer-form-page form {
          padding: 24px;
        }

        .customer-form-page .form-section-label {
          margin: 0 0 16px;
          color: #344054;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .05em;
        }

        .customer-form-page .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px 22px;
        }

        .customer-form-page .form-group {
          min-width: 0;
        }

        .customer-form-page .form-group.full-width {
          grid-column: 1 / -1;
        }

        .customer-form-page label {
          display: block;
          margin-bottom: 7px;
          color: #344054;
          font-size: 13px;
          font-weight: 650;
        }

        .customer-form-page input {
          width: 100%;
          min-height: 44px;
          padding: 10px 13px;
          border: 1px solid #d0d5dd;
          border-radius: 9px;
          outline: none;
          background: #fff;
          color: var(--cf-text);
          font: inherit;
          font-size: 14px;
          transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .customer-form-page input::placeholder {
          color: #98a2b3;
        }

        .customer-form-page input:hover:not(:disabled) {
          border-color: #b8c0cc;
        }

        .customer-form-page input:focus {
          border-color: #84a9f8;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, .10);
        }

        .customer-form-page input:disabled {
          cursor: not-allowed;
          background: #f4f6f8;
          color: #667085;
        }

        .customer-form-page .form-help {
          display: block;
          margin-top: 7px;
          color: #7b8794;
          font-size: 12px;
          line-height: 1.4;
        }

        .customer-form-page .form-info {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-top: 22px;
          padding: 12px 14px;
          border: 1px solid #e4e9f2;
          border-radius: 10px;
          background: #f8fafc;
          color: #667085;
          font-size: 12px;
          line-height: 1.5;
        }

        .customer-form-page .form-info-icon {
          flex: 0 0 auto;
          color: #64748b;
          font-weight: 800;
        }

        .customer-form-page .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid var(--cf-border-soft);
        }

        .customer-form-page .primary-button,
        .customer-form-page .secondary-button {
          min-height: 42px;
          padding: 9px 16px;
          border-radius: 9px;
          font: inherit;
          font-size: 13px;
          font-weight: 650;
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease, background .15s ease, border-color .15s ease;
        }

        .customer-form-page .primary-button {
          border: 1px solid var(--cf-primary);
          background: var(--cf-primary);
          color: #fff;
          box-shadow: 0 3px 8px rgba(37, 99, 235, .18);
        }

        .customer-form-page .primary-button:hover:not(:disabled) {
          background: var(--cf-primary-dark);
          transform: translateY(-1px);
          box-shadow: 0 5px 12px rgba(37, 99, 235, .22);
        }

        .customer-form-page .secondary-button {
          border: 1px solid #d0d5dd;
          background: #fff;
          color: #344054;
        }

        .customer-form-page .secondary-button:hover:not(:disabled) {
          border-color: #b8c0cc;
          background: #f9fafb;
        }

        .customer-form-page button:disabled {
          cursor: not-allowed;
          opacity: .58;
          transform: none;
          box-shadow: none;
        }

        .customer-form-page .error-message {
          margin-bottom: 18px;
          padding: 12px 14px;
          border: 1px solid #f1c5c9;
          border-radius: 10px;
          background: #fff4f5;
          color: #b42318;
          font-size: 13px;
          line-height: 1.5;
        }

        .customer-form-page .customer-form-state {
          display: flex;
          min-height: 260px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px;
          text-align: center;
          color: var(--cf-muted);
        }

        .customer-form-page .customer-form-state strong {
          margin-top: 12px;
          color: var(--cf-text);
          font-size: 16px;
        }

        .customer-form-page .customer-form-state p {
          margin: 6px 0 0;
          font-size: 13px;
        }

        .customer-form-page .customer-form-state-icon {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border-radius: 50%;
          background: #fff4f5;
          color: #dc2626;
          font-weight: 800;
        }

        .customer-form-page .customer-form-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid #e5e7eb;
          border-top-color: var(--cf-primary);
          border-radius: 50%;
          animation: customer-form-spin .8s linear infinite;
        }

        @keyframes customer-form-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 760px) {
          .customer-form-page .page-header {
            align-items: stretch;
            flex-direction: column;
          }

          .customer-form-page .page-header h2 {
            font-size: 24px;
          }

          .customer-form-page .form-grid {
            grid-template-columns: 1fr;
          }

          .customer-form-page .form-group.full-width {
            grid-column: auto;
          }

          .customer-form-page form {
            padding: 18px;
          }

          .customer-form-page .form-header {
            padding: 18px;
          }

          .customer-form-page .form-actions {
            flex-direction: column-reverse;
          }

          .customer-form-page .primary-button,
          .customer-form-page .secondary-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <span className="admin-page-kicker">Customer Management</span>
          <h2>{isEditMode ? "Edit Customer" : "Add Customer"}</h2>
          <p>
            {isEditMode
              ? "Update the customer's information."
              : "Create a new customer record for ServiOps."}
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={handleCancel}
          disabled={saving}
        >
          ← Back to Customers
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <section className="form-card">
        <div className="form-header">
          <div className="form-header-icon">C</div>
          <div>
            <h3>
              {isEditMode ? "Customer Information" : "New Customer"}
            </h3>
            <p>Enter the core customer and contact details.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section-label">Customer Details</div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="customer_code">Customer Code *</label>
              <input
                id="customer_code"
                type="text"
                name="customer_code"
                value={formData.customer_code}
                onChange={handleChange}
                placeholder="e.g. CUS001"
                required
                disabled={isEditMode}
              />
              {isEditMode && (
                <small className="form-help">
                  Customer code cannot be changed after creation.
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="name">Customer Name *</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Customer name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="customer@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                id="city"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
              />
            </div>

            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input
                id="country"
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Country"
              />
            </div>
          </div>

          <div className="form-info">
            <span className="form-info-icon">i</span>
            <span>
              Customer code is required when creating a customer and remains
              locked after creation. Optional contact and location fields can
              be left blank.
            </span>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Create Customer"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default CustomerForm;



