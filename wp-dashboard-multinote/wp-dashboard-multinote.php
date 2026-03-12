<?php
/**
 * Plugin Name:       WP Dashboard Multinote
 * Plugin URI:        https://github.com/jorgelr771/WP-Dashboard-Multinote
 * Description:       Widget de múltiples notas rápidas en el escritorio de WordPress. Creación, edición y borrado vía AJAX.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      8.0
 * Author:            Jorge
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       wp-dashboard-multinote
 * Domain Path:       /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Definir constantes
define( 'WPCDW_VERSION', '1.0.0' );
define( 'WPCDW_PATH', plugin_dir_path( __FILE__ ) );
define( 'WPCDW_URL', plugin_dir_url( __FILE__ ) );

// Cargar la clase principal
require_once WPCDW_PATH . 'includes/class-notes-widget.php';

// Iniciar el widget
new WPCDW_Notes_Widget();