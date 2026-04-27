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
        
        // Enqueue the React app CSS
        wp_enqueue_style(
            'retirement-planner-style',
            $plugin_url . 'dist/assets/index.css',
            array(),
            '2.0'
        );
        
        // Enqueue the React app JS
        wp_enqueue_script(
            'retirement-planner-script',
            $plugin_url . 'dist/assets/index.js',
            array(), // no dependencies, it's bundled
            '2.0',
            true // load in footer
        );
        
        // If the React app uses <script type="module">, we need to add type="module" to the tag
        add_filter('script_loader_tag', function($tag, $handle, $src) {
            if ('retirement-planner-script' === $handle) {
                return '<script type="module" src="' . esc_url($src) . '"></script>';
            }
            return $tag;
        }, 10, 3);
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
