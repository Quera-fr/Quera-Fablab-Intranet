interface LogoProps {
    className?: string;
    onClick?: () => void;
}

const Logo = ({ className = "w-12 h-12", onClick }: LogoProps) => (
    <img
        src="/logo.jpg"
        alt="Quera Fablab Logo"
        className={`${className} object-cover rounded-full ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={onClick}
    />
);

export default Logo;
