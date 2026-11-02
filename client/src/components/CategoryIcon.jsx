import Restaurant from '@mui/icons-material/Restaurant';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import LocalCafe from '@mui/icons-material/LocalCafe';
import Home from '@mui/icons-material/Home';
import Chair from '@mui/icons-material/Chair';
import Checkroom from '@mui/icons-material/Checkroom';
import LocalHospital from '@mui/icons-material/LocalHospital';
import DirectionsBus from '@mui/icons-material/DirectionsBus';
import Flight from '@mui/icons-material/Flight';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import Category from '@mui/icons-material/Category';

const ICONS = { food: Restaurant, groceries: ShoppingCart, snack: LocalCafe, necessities: Home, 'for home': Chair,
  clothes: Checkroom, health: LocalHospital, transportation: DirectionsBus, travel: Flight, gym: FitnessCenter };
export default function CategoryIcon({ category, ...p }) {
  const I = ICONS[category] || Category;
  return <I {...p} />;
}
