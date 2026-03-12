<?php
/**
 * Clase principal del widget de notas rápidas en el dashboard.
 *
 * @package WP_Custom_Dashboard_Widgets
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class WPCDW_Notes_Widget {

    /**
     * Constructor.
     */
    public function __construct() {
        // Registrar acciones AJAX siempre (necesario para que funcionen las peticiones)
        add_action( 'wp_ajax_wpcdw_add_note',    [ $this, 'add_note' ] );
        add_action( 'wp_ajax_wpcdw_update_note', [ $this, 'update_note' ] );
        add_action( 'wp_ajax_wpcdw_delete_note', [ $this, 'delete_note' ] );

        // Solo en la carga real del dashboard (evitamos duplicados en AJAX)
        if ( ! defined( 'DOING_AJAX' ) ) {
            add_action( 'wp_dashboard_setup',    [ $this, 'register_widget' ] );
            add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_scripts' ] );
        }
    }


    /**
     * Registra el widget en el dashboard de WordPress.
     */
    public function register_widget() {
        wp_add_dashboard_widget(
            'wpcdw_notes_widget',
            '📝 Notas rápidas',
            [ $this, 'render_widget' ]
        );
    }


    /**
     * Renderiza el contenido HTML del widget.
     */
    public function render_widget() {
        $notes = get_option( 'wpcdw_notes', [] );

        if ( ! is_array( $notes ) ) {
            $notes = [];
        }

        // Nota de ejemplo solo para desarrollo / primera instalación (puedes comentarlo después)
        if ( empty( $notes ) ) {
            $notes = [
                [
                    'id'      => 'demo-1',
                    'title'   => 'Nota de ejemplo',
                    'content' => "Esto es lo primero que se ve.\n¡Vamos a hacer multinota!",
                    'date'    => current_time( 'mysql' ),
                ],
            ];
        }
        ?>
        <div id="wpcdw-notes-container">
            <?php foreach ( $notes as $note ) : ?>
                <div class="wpcdw-note" data-id="<?php echo esc_attr( $note['id'] ); ?>">
                    <input
                        type="text"
                        class="wpcdw-note-title"
                        value="<?php echo esc_attr( $note['title'] ?? '' ); ?>"
                        placeholder="Título de la nota..."
                    />
                    <textarea class="wpcdw-note-content"><?php echo esc_textarea( $note['content'] ?? '' ); ?></textarea>
                    <div class="wpcdw-note-actions">
                        <button class="button wpcdw-save-note">Guardar</button>
                        <button class="button wpcdw-delete-note">Borrar</button>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <button id="wpcdw-add-note" class="button button-primary" style="margin-top:12px;">
            + Nueva nota
        </button>

        <p id="wpcdw-message"></p>

        <style>
            .wpcdw-note {
                border: 1px solid #ddd;
                padding: 10px;
                margin-bottom: 12px;
                background: #fff;
                border-radius: 4px;
            }
            .wpcdw-note-title {
                width: 100%;
                font-size: 1.1em;
                margin-bottom: 6px;
                padding: 4px;
            }
            .wpcdw-note-content {
                width: 100%;
                height: 80px;
                margin-bottom: 8px;
            }
            .wpcdw-note-actions {
                text-align: right;
            }
        </style>
        <?php
    }


    /**
     * Encola el script JS y pasa variables vía wp_localize_script.
     */
    public function enqueue_scripts() {
        wp_enqueue_script(
            'wpcdw-notes-js',
            WPCDW_URL . 'assets/js/notes.js',
            [ 'jquery' ],
            '1.0',
            true
        );

        wp_localize_script(
            'wpcdw-notes-js',
            'wpcdw_ajax',
            [
                'url'   => admin_url( 'admin-ajax.php' ),
                'nonce' => wp_create_nonce( 'wpcdw_nonce' ),
            ]
        );
    }


    /**
     * Añade una nueva nota vacía.
     */
    public function add_note() {
        check_ajax_referer( 'wpcdw_nonce', '_ajax_nonce' );

        $notes = get_option( 'wpcdw_notes', [] );
        if ( ! is_array( $notes ) ) {
            $notes = [];
        }

        $new_note = [
            'id'      => 'note-' . wp_generate_uuid4(),
            'title'   => '',
            'content' => '',
            'date'    => current_time( 'mysql' ),
        ];

        $notes[] = $new_note;
        update_option( 'wpcdw_notes', $notes );

        wp_send_json_success( $new_note );
    }


    /**
     * Actualiza título y contenido de una nota existente.
     */
    public function update_note() {
        check_ajax_referer( 'wpcdw_nonce', '_ajax_nonce' );

        $note_id = sanitize_text_field( $_POST['note_id'] ?? '' );
        $title   = sanitize_text_field( $_POST['title'] ?? '' );
        $content = sanitize_textarea_field( $_POST['content'] ?? '' );

        $notes   = get_option( 'wpcdw_notes', [] );
        if ( ! is_array( $notes ) ) {
            $notes = [];
        }

        $updated = false;

        foreach ( $notes as $index => $note ) {
            if ( isset( $note['id'] ) && $note['id'] === $note_id ) {
                $notes[ $index ]['title']   = $title;
                $notes[ $index ]['content'] = $content;
                $notes[ $index ]['date']    = current_time( 'mysql' );
                $updated = true;
                break;
            }
        }

        if ( $updated ) {
            update_option( 'wpcdw_notes', $notes );
            wp_send_json_success( 'Nota guardada correctamente.' );
        } else {
            wp_send_json_error( 'No se encontró la nota.' );
        }
    }


    /**
     * Elimina una nota por su ID.
     */
    public function delete_note() {
        check_ajax_referer( 'wpcdw_nonce', '_ajax_nonce' );

        $note_id = sanitize_text_field( $_POST['note_id'] ?? '' );

        if ( empty( $note_id ) ) {
            wp_send_json_error( 'ID de nota no válido.' );
        }

        $notes = get_option( 'wpcdw_notes', [] );
        if ( ! is_array( $notes ) ) {
            wp_send_json_error( 'No hay notas almacenadas.' );
        }

        $found = false;

        foreach ( $notes as $index => $note ) {
            if ( isset( $note['id'] ) && $note['id'] === $note_id ) {
                unset( $notes[ $index ] );
                $found = true;
                break;
            }
        }

        if ( $found ) {
            $notes = array_values( $notes ); // Reindexar
            update_option( 'wpcdw_notes', $notes );
            wp_send_json_success( 'Nota eliminada correctamente.' );
        } else {
            wp_send_json_error( 'No se encontró la nota para eliminar.' );
        }
    }
}