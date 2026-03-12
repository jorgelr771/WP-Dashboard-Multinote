<?php
/**
 * Plugin Name:       WP Custom Dashboard Notes
 * Description:       Widget de notas rápidas múltiples en el escritorio con creación, edición y borrado vía AJAX.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Author:            Jorge
 * Author URI:        https://github.com/tu-usuario
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       wp-custom-dashboard-notes
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

// Definir constantes de rutas (útiles para includes y assets)
define( 'WPCDW_VERSION', '1.2.0' );
define( 'WPCDW_PATH', plugin_dir_path( __FILE__ ) );
define( 'WPCDW_URL', plugin_dir_url( __FILE__ ) );

// Cargar la clase principal del widget
require_once WPCDW_PATH . 'includes/class-notes-widget.php';

// Instanciar la clase (esto registra todo lo necesario)
new WPCDW_Notes_Widget();