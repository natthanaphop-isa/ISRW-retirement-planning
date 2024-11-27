import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

# Function to simulate retirement fund growth and withdrawals
def retirement_simulation(
    current_age, 
    retirement_age, 
    life_expectancy,
    starting_principal,
    annual_contribution,
    annual_expense,
    inflation_rate,
    annualized_return_pre,
    annualized_return_final_years,
    years_final_return,
    annualized_return_post
):
    years_to_retirement = retirement_age - current_age
    years_post_retirement = life_expectancy - retirement_age
    total_years = years_to_retirement + years_post_retirement

    # Initialize values
    age_range = np.arange(current_age, life_expectancy + 1)
    fund_balance = np.zeros_like(age_range, dtype=float)
    cumulative_expense = np.zeros_like(age_range, dtype=float)
    fund_balance[0] = starting_principal

    for i, age in enumerate(age_range[1:], start=1):
        if age < retirement_age - years_final_return:
            # Early pre-retirement: add contributions and apply initial pre-retirement return
            fund_balance[i] = (fund_balance[i-1] + annual_contribution) * (1 + annualized_return_pre)
        elif age < retirement_age:
            # Final specified years before retirement: use different, more conservative return rate
            fund_balance[i] = (fund_balance[i-1] + annual_contribution) * (1 + annualized_return_final_years)
        else:
            # Post-retirement: subtract expenses and apply post-retirement return
            annual_withdrawal = annual_expense * (1 + inflation_rate) ** (age - retirement_age)
            fund_balance[i] = (fund_balance[i-1] - annual_withdrawal) * (1 + annualized_return_post)
            cumulative_expense[i] = cumulative_expense[i-1] + annual_withdrawal
            
            # If fund depletes, stop the calculation
            if fund_balance[i] < 0:
                fund_balance[i:] = 0
                cumulative_expense[i:] = cumulative_expense[i-1]
                break
    
    df = pd.DataFrame({
        'Age': age_range,
        'Fund Balance': fund_balance,
        'Cumulative Expense': cumulative_expense
    })

    # Create interactive plot with Plotly
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df['Age'], 
        y=df['Fund Balance'],
        mode='lines+markers',
        name='Fund Balance',
        hovertemplate='Age: %{x}<br>Balance: ฿%{y:,.0f}<extra></extra>'
    ))
    
    # Add line for cumulative expenses
    fig.add_trace(go.Scatter(
        x=df['Age'], 
        y=df['Cumulative Expense'],
        mode='lines+markers',
        name='Cumulative Expense',
        hovertemplate='Age: %{x}<br>Cumulative Expense: ฿%{y:,.0f}<extra></extra>',
        line=dict(dash='dash', color='red')
    ))

    # Add vertical lines for key milestones
    fig.add_vline(x=retirement_age - years_final_return, line=dict(color='orange', dash='dash'), 
                  annotation_text=f'Final {years_final_return} Years Pre-Retirement', annotation_position="top left")
    fig.add_vline(x=retirement_age, line=dict(color='green', dash='dash'), 
                  annotation_text='Retirement Age', annotation_position="top right")
    fig.add_vline(x=life_expectancy, line=dict(color='blue', dash='dash'), 
                  annotation_text='Life Expectancy', annotation_position="top right")

    # Update layout with hovermode set to 'x unified' and auto-size enabled
    fig.update_layout(
        title='Retirement Fund Projection',
        xaxis_title='Age',
        yaxis_title='Amount (฿)',
        yaxis_tickformat=',',
        hovermode='x unified',  # Show all values on the same x-axis when hovering
        autosize=True,  # Make the graph resize automatically
        legend=dict(
            orientation='h',  # Horizontal legend
            yanchor='bottom',  # Anchor the legend to the bottom
            y=-0.2,  # Position the legend just below the plot
            xanchor='center',  # Center the legend horizontally
            x=0.5  # Center the legend horizontally
        )
    )

    return fig, df

# Streamlit App Layout
st.title("Retirement Fund Simulation")
st.image("assets/retirement_planning.jpg", use_column_width=True)

# Sidebar Inputs
st.sidebar.header("Input Parameters")
current_age = st.sidebar.slider("Current Age", 20, 50, 27, 1)
retirement_age = st.sidebar.slider("Retirement Age", 50, 75, 60, 1)
life_expectancy = st.sidebar.slider("Life Expectancy", 70, 100, 85, 1)
starting_principal = st.sidebar.number_input("Starting Principal (฿)", 0, 10000000, 1000000, 1000)
annual_contribution = st.sidebar.number_input("Annual Contribution (฿)", 0, 1000000, 100000, 1000)
annual_expense = st.sidebar.number_input("Annual Expense in Retirement (฿)", 0, 10000000, 500000, 1000)
inflation_rate = st.sidebar.slider("Inflation Rate (%)", 0.0, 0.1, 0.035, 0.005)
annualized_return_pre = st.sidebar.slider("Annualized Return (Pre-Retirement) (%)", 0.0, 0.15, 0.07, 0.005)
annualized_return_final_years = st.sidebar.slider("Annualized Return (Final Years Pre-Retirement) (%)", 0.0, 0.1, 0.05, 0.005)
years_final_return = st.sidebar.slider("Years of Final Return Rate Before Retirement", 1, 20, 10, 1)
annualized_return_post = st.sidebar.slider("Annualized Return (Post-Retirement) (%)", 0.0, 0.1, 0.035, 0.005)

# Run Simulation
fig, df = retirement_simulation(
    current_age=current_age, 
    retirement_age=retirement_age, 
    life_expectancy=life_expectancy,
    starting_principal=starting_principal,
    annual_contribution=annual_contribution,
    annual_expense=annual_expense,
    inflation_rate=inflation_rate,
    annualized_return_pre=annualized_return_pre,
    annualized_return_final_years=annualized_return_final_years,
    years_final_return=years_final_return,
    annualized_return_post=annualized_return_post
)

# Check if retirement plan is successful
final_fund_balance = df.iloc[-1]['Fund Balance']
if final_fund_balance > 0:
    status = "Successful ✅"
    recommendation = "Your retirement plan is well-funded through life expectancy."
    box_color = "#D4EDDA"  # Green box color for success
    text_color = "#155724"  # Dark green text for success
else:
    status = "Unsuccessful ❌"
    recommendation = (
        "Consider increasing your annual contribution, extending your retirement age, "
        "or expecting higher returns to ensure your funds last through life expectancy."
    )
    box_color = "#F8D7DA"  # Red box color for failure
    text_color = "#721C24"  # Dark red text for failure

# Display the Plotly chart
st.plotly_chart(fig, use_column_width=True)  # Set use_column_width=True for responsive resizing

# Display Summary with colored box around the status and recommendation
st.header("Summary of Your Parameters and Plan")

# Apply HTML styling with the correct box color
st.markdown(f"""
    <div style="background-color:{box_color}; padding: 15px; border-radius: 5px;">
        <h3 style="color:{text_color};">Retirement Plan Status: <strong>{status}</strong></h3>
        <p style="color:{text_color};">{recommendation}</p>
    </div>
""", unsafe_allow_html=True)

st.markdown(f"""
- **Current Age:** {current_age}
- **Retirement Age:** {retirement_age}
- **Life Expectancy:** {life_expectancy}
- **Starting Principal:** ฿{starting_principal:,.0f}
- **Annual Contribution:** ฿{annual_contribution:,.0f}
- **Annual Expense in Retirement:** ฿{annual_expense:,.0f}
- **Inflation Rate:** {inflation_rate * 100:.1f}%
- **Annualized Return (Pre-Retirement):** {annualized_return_pre * 100:.1f}%
- **Annualized Return (Final Years Pre-Retirement):** {annualized_return_final_years * 100:.1f}%
- **Years of Final Return Rate Before Retirement:** {years_final_return}
- **Annualized Return (Post-Retirement):** {annualized_return_post * 100:.1f}%
""")
