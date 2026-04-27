<?php
/**
 * Plugin Name: Retirement Planner Embed
 * Description: Shortcode [retirement_planner] to embed the React + FastAPI retirement planner.
 * Version: 1.0
 */

if (!defined('ABSPATH')) {
    exit;
}

function retirement_planner_shortcode($atts) {
    $atts = shortcode_atts(array(
        'height' => '900px',
        'api_url' => get_option('rp_api_url', 'http://localhost:8000')
    ), $atts);
    
    $height = esc_attr($atts['height']);
    $api_url = esc_url($atts['api_url']);
    
    return "<iframe src='{$api_url}' width='100%' height='{$height}' style='border:none;' loading='lazy'></iframe>";
}
add_shortcode('retirement_planner', 'retirement_planner_shortcode');

function rp_settings_menu() {
    add_options_page('Retirement Planner', 'Retirement Planner', 'manage_options', 'retirement-planner', 'rp_settings_page');
}
add_action('admin_menu', 'rp_settings_menu');

function rp_settings_page() {
    if (isset($_POST['rp_api_url']) && current_user_can('manage_options')) {
        update_option('rp_api_url', sanitize_text_field($_POST['rp_api_url']));
        echo "<div class='updated'><p>Settings saved.</p></div>";
    }
    $api_url = get_option('rp_api_url', 'http://localhost:8000');
    ?>
    <div class="wrap">
        <h2>Retirement Planner Settings</h2>
        <form method="post" action="">
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">API URL (where FastAPI is hosted)</th>
                    <td><input type="text" name="rp_api_url" value="<?php echo esc_attr($api_url); ?>" style="width:100%;max-width:400px;" /></td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}
