import { TouchableOpacity, StyleSheet, Linking } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const WHATSAPP_NUMBER = '22996950040';

export default function WhatsAppButton() {
  function handlePress() {
    const message = encodeURIComponent('Bonjour, j\'ai besoin d\'aide avec EventPass.');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    Linking.openURL(url).catch(() => {});
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress} activeOpacity={0.85}>
      <Svg width="30" height="30" viewBox="0 0 24 24" fill="none">
        <Path
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-1.732-.866-2.866-1.546-4.005-3.504-.303-.523.303-.485.864-1.615.099-.197.05-.371-.05-.52-.149-.198-.842-2.014-1.139-2.708-.297-.694-.583-.604-.793-.604-.198 0-.624.075-.96.075a.91.91 0 00-.694.297c-.297.347-1.139 1.139-1.139 2.708 0 1.57 1.139 3.115 1.288 3.314.149.198 2.054 3.116 4.989 4.247 2.935 1.13 2.935.75 3.464.694.53-.05 1.708-.694 1.956-1.366.247-.673.247-1.247.173-1.366-.075-.124-.273-.198-.57-.347z"
          fill="#fff"
        />
        <Path
          d="M12.001 2.003c-5.514 0-9.997 4.483-9.997 9.997 0 1.766.463 3.42 1.273 4.851l-1.347 4.92 5.04-1.323a9.93 9.93 0 005.031 1.346c5.514 0 9.997-4.483 9.997-9.997s-4.483-9.997-9.997-9.997zm0 18.184a8.16 8.16 0 01-4.166-1.142l-.299-.178-3.099.813.825-3.022-.195-.31a8.155 8.155 0 01-1.255-4.358c0-4.515 3.674-8.19 8.19-8.19 4.515 0 8.189 3.674 8.189 8.19 0 4.515-3.674 8.197-8.19 8.197z"
          fill="#fff"
        />
      </Svg>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
});