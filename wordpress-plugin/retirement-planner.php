<?php
/**
 * Plugin Name: Retirement Planner
 * Description: Shortcode [retirement_planner] to embed the React-based Retirement Planner. No separate backend required.
 * Version: 2.0
 */

if (!defined('ABSPATH')) {
    exit;
}

function retirement_planner_enqueue_scripts() {
    // Only enqueue if the shortcode is on the page
    global $post;
    if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'retirement_planner')) {
        $plugin_url = plugin_dir_url(__FILE__);
        $plugin_dir = plugin_dir_path(__FILE__);
        
        // Find the hashed asset files dynamically
        $css_files = glob($plugin_dir . 'dist/assets/index-*.css');
        $js_files  = glob($plugin_dir . 'dist/assets/index-*.js');
        
        if (!empty($css_files)) {
            $css_file = basename($css_files[0]);
            wp_enqueue_style(
                'retirement-planner-style',
                $plugin_url . 'dist/assets/' . $css_file,
                array(),
                filemtime($css_files[0])
            );
        }
        
        if (!empty($js_files)) {
            $js_file = basename($js_files[0]);
            wp_enqueue_script(
                'retirement-planner-script',
                $plugin_url . 'dist/assets/' . $js_file,
                array(),
                filemtime($js_files[0]),
                true
            );
            
            add_filter('script_loader_tag', function($tag, $handle, $src) {
                if ('retirement-planner-script' === $handle) {
                    return '<script type="module" src="' . esc_url($src) . '"></script>';
                }
                return $tag;
            }, 10, 3);
        }
    }
}
add_action('wp_enqueue_scripts', 'retirement_planner_enqueue_scripts');

function retirement_planner_shortcode($atts) {
    // The React app mounts onto a div with id="root". 
    // To avoid conflicts, we mount it on a specific ID and modify main.jsx, or keep it as "root" if it's the only React app.
    // Let's use a unique ID.
    return '<div id="retirement-planner-root"></div>';
}
add_shortcode('retirement_planner', 'retirement_planner_shortcode');
