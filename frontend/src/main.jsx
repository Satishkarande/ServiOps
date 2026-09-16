import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  AuthProvider,
} from "./auth/AuthContext";

import AuthCallback from "./auth/AuthCallback";

import App from "./App";
import MyProfile from "./Pages/MyProfile";
import Dashboard from "./Pages/Dashboard";
import Customers from "./Pages/Customers";
import CustomerForm from "./Pages/CustomerForm";
import CustomerDetails from "./Pages/CustomerDetails";
import Plants from "./Pages/Plants";
import PlantForm from "./Pages/PlantForm";
import PlantDetails from "./Pages/PlantDetails";
import Machines from "./Pages/Machines";
import MachineForm from "./Pages/MachineForm";
import MachineDetails from "./Pages/MachineDetails";
import Tickets from "./Pages/Tickets";
import TicketCreate from "./Pages/TicketCreate";
import TicketDetails from "./Pages/TicketDetails";
import TicketEdit from "./Pages/TicketEdit";
import Users from "./Pages/Users";
import UserCreate from "./Pages/UserCreate";
import UserEdit from "./Pages/UserEdit";
import Roles from "./Pages/Roles";
import RoleForm from "./Pages/RoleForm";
import Permissions from "./Pages/Permissions";
import PermissionForm from "./Pages/PermissionForm";
import SpareParts from "./Pages/SpareParts";
import SparePartDetails from "./Pages/SparePartDetails";
import SparePartForm from "./Pages/SparePartForm";
import Inventory from "./Pages/Inventory";
import StockMovements from "./Pages/StockMovements";

import "./index.css";


ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <React.StrictMode>

    <AuthProvider>

      <BrowserRouter>

        <Routes>

          {/* =====================================================
              COGNITO CALLBACK
          ====================================================== */}

          <Route
            path="/auth/callback"
            element={
              <AuthCallback />
            }
          />


          {/* =====================================================
              MAIN APPLICATION
          ====================================================== */}

          <Route
            path="/"
            element={
              <App />
            }
          >

            {/* / → /dashboard */}

            <Route
              index
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />


            {/* =================================================
                DASHBOARD
            ================================================== */}

            <Route
              path="dashboard"
              element={
                <Dashboard />
              }
            />

{/* =================================================
                MY PROFILE
            ================================================== */}
           <Route
  path="profile"
  element={
    <MyProfile />
  }
/>


            {/* =================================================
    CUSTOMERS
================================================== */}

<Route
  path="customers"
  element={
    <Customers />
  }
/>

<Route
  path="customers/:customerId"
  element={
    <CustomerDetails />
  }
/>

<Route
  path="customers/new"
  element={
    <CustomerForm />
  }
/>

<Route
  path="customers/:customerId/edit"
  element={
    <CustomerForm />
  }
/>


            {/* =================================================
    PLANTS
================================================== */}

<Route
  path="plants"
  element={<Plants />}
/>

<Route
  path="plants/new"
  element={<PlantForm />}
/>

<Route
  path="plants/:plantId"
  element={<PlantDetails />}
/>

<Route
  path="plants/:plantId/edit"
  element={<PlantForm />}
/>

 {/* =================================================
   MACHINES
================================================== */}


            <Route
  path="machines"
  element={
    <Machines />
  }
/>

<Route
  path="machines/new"
  element={
    <MachineForm />
  }
/>

<Route
  path="machines/:machineId"
  element={
    <MachineDetails />
  }
/>

<Route
  path="machines/:machineId/edit"
  element={
    <MachineForm />
  }
/>
 {/* =================================================
    tickets
================================================== */}

           <Route
  path="tickets"
  element={
    <Tickets />
  }
/>

<Route
  path="tickets/new"
  element={
    <TicketCreate />
  }
/>

<Route
  path="tickets/:ticketId/edit"
  element={
    <TicketEdit />
  }
/>

<Route
  path="tickets/:ticketId"
  element={
    <TicketDetails />
  }
/>
 {/* =================================================
    users, roles, permissions
================================================== */}


           <Route
  path="users"
  element={
    <Users />
  }
/>

<Route
  path="users/new"
  element={
    <UserCreate />
  }
/>

<Route
  path="users/:userId/edit"
  element={
    <UserEdit />
  }
/>


            <Route
  path="roles"
  element={
    <Roles />
  }
/>

<Route
  path="roles/new"
  element={
    <RoleForm />
  }
/>

<Route
  path="roles/:roleId/edit"
  element={
    <RoleForm />
  }
/>


            <Route
  path="permissions"
  element={
    <Permissions />
  }
/>

<Route
  path="permissions/new"
  element={
    <PermissionForm />
  }
/>

<Route
  path="permissions/:permissionId/edit"
  element={
    <PermissionForm />
  }
/>

<Route path="spare-parts" element={<SpareParts />} />
<Route path="spare-parts/:sparePartId" element={<SparePartDetails />} />
<Route path="spare-parts/new" element={<SparePartForm />} />
<Route path="spare-parts/:sparePartId/edit" element={<SparePartForm />} />
<Route path="inventory" element={<Inventory />} />
<Route path="stock-movements" element={<StockMovements />} />

          </Route>

        </Routes>

      </BrowserRouter>

    </AuthProvider>

  </React.StrictMode>
);


export default null;



