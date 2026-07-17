import useMediaQuery from '../hooks/useMediaQuery';
import MahasiswaDesktopLayout from './MahasiswaDesktopLayout';
import MahasiswaMobileLayout from './MahasiswaMobileLayout';

export default function MahasiswaLayout(props) {
  // Jika lebar layar <= 768px, dianggap mobile.
  // Gunakan MobileLayout, jika tidak gunakan DesktopLayout.
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return <MahasiswaMobileLayout {...props} />;
  }

  return <MahasiswaDesktopLayout {...props} />;
}
