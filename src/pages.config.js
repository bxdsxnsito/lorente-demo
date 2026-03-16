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
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ProductSimulator from './pages/ProductSimulator';
import AIAnalysis from './pages/AIAnalysis';
import RouteMap from './pages/RouteMap';
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
    "Profile": Profile,
    "Settings": Settings,
    "ProductSimulator": ProductSimulator,
    "AIAnalysis": AIAnalysis,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};