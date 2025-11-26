import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Client360 from './pages/Client360';
import Agenda from './pages/Agenda';
import Opportunities from './pages/Opportunities';
import Loans from './pages/Loans';
import Cards from './pages/Cards';
import Products from './pages/Products';
import Supervision from './pages/Supervision';
import Admin from './pages/Admin';
import DeveloperControls from './pages/DeveloperControls';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clients": Clients,
    "Client360": Client360,
    "Agenda": Agenda,
    "Opportunities": Opportunities,
    "Loans": Loans,
    "Cards": Cards,
    "Products": Products,
    "Supervision": Supervision,
    "Admin": Admin,
    "DeveloperControls": DeveloperControls,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};