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
    annualized_return_post,
    etc_expense,
    health_insurance_expense,
    health_risk_expense
):
    years_to_retirement = retirement_age - current_age
    years_post_retirement = life_expectancy - retirement_age
    total_years = years_to_retirement + years_post_retirement

    # Initialize values
    age_range = np.arange(current_age, life_expectancy + 1)
    fund_balance = np.zeros_like(age_range, dtype=float)
    cumulative_expense = np.zeros_like(age_range, dtype=float)
    fund_balance[0] = starting_principal
    yearly_health_expense = health_insurance_expense / years_post_retirement if years_post_retirement > 0 else 0
    etc_expense = etc_expense * ((1 + inflation_rate)**years_to_retirement)
    zero_age = 0
    retire_fund = []
    
    for i, age in enumerate(age_range[1:], start=1):
        # annual_contribution = annual_contribution * ((1 + aContribution_rate)**i)
        if age < retirement_age - years_final_return:
            # Early pre-retirement: add contributions and apply initial pre-retirement return
            fund_balance[i] = (fund_balance[i-1] + annual_contribution) * (1 + annualized_return_pre)
        elif age < retirement_age:
            # Final specified years before retirement: use different, more conservative return rate
            fund_balance[i] = (fund_balance[i-1] + annual_contribution) * (1 + annualized_return_final_years)
        elif age == retirement_age:
            fund_balance[i] = (fund_balance[i-1] + annual_contribution) * (1 + annualized_return_final_years)
            retire_fund.append(fund_balance[i])
        elif age == (retirement_age + 1):
            # Include one-time expenses in the withdrawal for the retirement year
            annual_withdrawal = (
                (annual_expense * (1 + inflation_rate) ** (age - retirement_age))
                + health_risk_expense
                + yearly_health_expense
                + etc_expense
            )
            fund_balance[i] = (fund_balance[i-1] - annual_withdrawal) * (1 + annualized_return_post)
            cumulative_expense[i] = cumulative_expense[i-1] + annual_withdrawal
        else:
            # Include one-time expenses in the withdrawal for the retirement year
            annual_withdrawal = (
                (annual_expense * (1 + inflation_rate) ** (age - retirement_age))
                + yearly_health_expense
            )
            fund_balance[i] = (fund_balance[i-1] - annual_withdrawal) * (1 + annualized_return_post)
            cumulative_expense[i] = cumulative_expense[i-1] + annual_withdrawal
            # If fund depletes, stop the calculation
            if fund_balance[i] < 0:
                zero_age = age
                fund_balance[i:] = 0
                cumulative_expense[i:] = cumulative_expense[i-1]
                break
    
    df = pd.DataFrame({
        'Age': age_range,
        'Fund Balance': [x / 1e6 for x in fund_balance],  # Convert to million Baht
        'Cumulative Expense': [x / 1e6 for x in cumulative_expense]  # Convert to million Baht
    })
    
    # Create interactive plot with Plotly
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df['Age'], 
        y=df['Fund Balance'],
        mode='lines+markers',
        name='เงินทุนเกษียณ',
        hovertemplate='อายุ: %{x}<br>เงินทุน: %{y:,.2f} ล้านบาท<extra></extra>'
    ))
    
    # Add line for cumulative expenses
    fig.add_trace(go.Scatter(
        x=df['Age'], 
        y=df['Cumulative Expense'],
        mode='lines+markers',
        name='รายจ่ายสะสม',
        hovertemplate='อายุ: %{x}<br>รายจ่ายสะสม: %{y:,.2f} ล้านบาท<extra></extra>',
        line=dict(dash='dash', color='red')
    ))
    
    # Add vertical lines for key milestones
    fig.add_vline(x=retirement_age - years_final_return, 
                  line=dict(color='orange', dash='dash'), 
                  annotation_text=f'{years_final_return} ปีสุดท้ายก่อนเกษียณ', annotation_position="top left")
    fig.add_vline(x=retirement_age, 
                  line=dict(color='green', dash='dash'), 
                  annotation_text='อายุเกษียณ', annotation_position="top right")
    fig.add_vline(x=life_expectancy, 
                  line=dict(color='black', dash='dash'), 
                  annotation_text='อายุขัย', annotation_position="top right")
    
    # Update layout with hovermode set to 'x unified' and auto-size enabled
    fig.update_layout(
        title='กราฟแสดงแผนการเกษียณ',
        xaxis_title='อายุ (ปี)',
        yaxis_title='จำนวนเงิน (ล้านบาท)',
        yaxis_tickformat=',',  # Format Y-axis ticks with commas
        hovermode='x unified',  # Show all values on the same x-axis when hovering
        autosize=True,  # Make the graph resize automatically
        legend=dict(
            orientation='h',  # Horizontal legend
            yanchor='bottom',  # Anchor the legend to the bottom
            y=-0.4,  # Move the legend further down (adjust as necessary)
            xanchor='center',  # Center the legend horizontally
            x=0.5  # Center the legend horizontally
        ),
        margin=dict(b=120)  # Increase bottom margin for more space
    )
    fig.layout.xaxis.fixedrange = True
    fig.layout.yaxis.fixedrange = True
    
    # Display the graph
    fig.show()


    return fig, df, retire_fund, zero_age

# Streamlit App Layout
# st.title("Retirement Planning by Isara Wealth")
st.image("assets/retirement_planning.jpg", use_container_width=True)

# Inputs
st.header("กรอกข้อมูล")
current_age = st.slider("อายุปัจจุบัน (ปี)", 1, 50, 27, 1)
retirement_age = st.slider("อายุเกษียณ (ปี)", 30, 75, 65, 1)
life_expectancy = st.slider("อายุขัย (ปี)", 50, 100, 85, 1)
starting_principal = st.number_input("เงินทุนตั้งต้น (฿)", 0, 10000000, 100000, 10000)
annual_contribution = st.number_input("เงินลงทุนเพิ่มต่อเดือน (฿)", 0, 1000000, 20000, 1000)*12
# selection0 = st.toggle("ต้องการเพิ่มการเติบโตของเงินออมเพื่อการลงทุนในแต่ละปีหรือไม่?")
# if selection0: 
#     aContribution_rate = st.slider("อัตราการเติบโตของเงินออมเพื่อการลงทุนต่อปี (%)", 0.0, 10.0, 3.5, 0.1) / 100
# else:
#     aContribution_rate = 0
    
need_expense = st.number_input("[NEED] ค่าใช้จ่ายจำเป็นหลังเกษียณต่อเดือน มูลค่าปัจจุบัน ไม่รวมเงินเฟ้อ (฿)", 0, 10000000, 20000, 1000)
want_expense = st.number_input("[WANT] ค่าใช้จ่าพิเศษหลังเกษียณต่อเดือน มูลค่าปัจจุบัน ไม่รวมเงินเฟ้อ (฿)", 0, 10000000, 20000, 1000)
selection1 = st.toggle("คำนวณทุนค่ารักษาพยาบาล ณ วันเกษียณ")
if selection1: 
    health_insurance_expense = st.number_input("[HEALTH] เบี้ยประกันสุขภาพ ณ วันเกษียณ จนสิ้นอายุขัย (฿)", 0, 10000000, 3000000, 100000)
    health_risk_expense = st.number_input("[HEALTH] ทุนค่าใช้จ่ายอื่น ๆ ด้านสุขภาพ หลังเกษียณ (฿)", 0, 10000000, 1000000, 100000)
else:
    health_insurance_expense = 0
    health_risk_expense = 0
    
selection2 = st.toggle("คำนวนค่าใช้จ่ายพิเศษอื่น ๆ ที่ต้องใช้เงินก้อน ณ วันเกษียณ")
if selection2: 
    etc_expense = st.number_input("[ETC.] ค่าใช้จ่ายพิเศษอื่น ๆ ที่ต้องใช้เงินก้อน ณ วันเกษียณ", 0, 10000000, 300000, 100000)
else:
    etc_expense = 0

# Adjusted sliders to display percentages properly
annual_expense = need_expense + want_expense
inflation_rate = st.slider("เงินเฟ้อ (%)", 0.0, 10.0, 3.5, 0.1) / 100  # Divide by 100 for calculation
retire_monthly_expense_no_inflation = annual_expense
annual_expense = annual_expense*12*(1+inflation_rate)**(retirement_age - current_age)
annualized_return_pre = st.slider("ผลตอบแทนคาดหวังเฉลี่ยต่อปี: ระยะสะสม (%)", 0.0, 20.0, 8.0, 0.1) / 100  # Divide by 100 for calculation
annualized_return_final_years = st.slider("ผลตอบแทนคาดหวังเฉลี่ยต่อปี: ระยะใกล้เกษียณ (%)", 0.0, 10.0, 5.0, 0.1) / 100  # Divide by 100 for calculation
years_final_return = st.slider("ปรับพอร์ตการลงทุนก่อนเกษียณกี่ปี: ระยะใกล้เกษียณ (ปี)", 1, 20, 5, 1)
annualized_return_post = st.slider("ผลตอบแทนคาดหวังเฉลี่ยต่อปี: ระยะหลังเกษียณ (%)", 0.0, 20.0, 3.5, 0.1) / 100  # Divide by 100 for calculation

# Run Simulation
fig, df, retire_fund, zero_age = retirement_simulation(
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
    annualized_return_post=annualized_return_post,
    health_insurance_expense = health_insurance_expense,
    health_risk_expense = health_risk_expense,
    etc_expense = etc_expense
)

# Check if a retirement plan is successful
final_fund_balance = df.iloc[-1]['Fund Balance'] * 1e6
if final_fund_balance > 0:
    status = "แผนเกษียณ เป็นไปได้ ✅"
    recommendation = (f"เงินทุนเกษียณของคุณเท่ากับ <b>฿{retire_fund[0]:,.0f}</b> ซึ่งมากพอต่อค่าใช้จ่ายต่าง ๆ หลังเกษียณ รวมเงินเฟ้อ <b>{inflation_rate*100:.1f}%</b> ต่อปีจนสิ้นอายุขัย"
                        f"และมีมรดกหลังสิ้นอายุขัย: <b>฿{final_fund_balance:,.0f}</b>")
    box_color = "#D4EDDA"  # Green box color for success
    text_color = "#155724"  # Dark green text for success
else:
    status = "เงินทุนเกษียณ ไม่เพียงพอ ❌"
    recommendation = (
        f"เงินทุนเกษียณของคุณหมดตอนอายุ {zero_age} ปี ซึ่งไม่พอต่อค่าใช้จ่ายหลังเกษียณ รวมเงินเฟ้อ <b>{inflation_rate*100:.1f}%</b> ต่อปีจนสิ้นอายุขัย"
        "คุณอาจต้อง เพิ่มจำนวนเงินลงทุนต่อปี หรือ เพิ่มผลตอบแทนคาดหวังต่อปี"
        "หรือ ยืดอายุเกษียณของคุณ เพื่อให้ทุนเกษียณเพียงพอต่อค่าใช้จ่ายหลังเกษียณของคุณ"
    )
    box_color = "#F8D7DA"  # Red box color for failure
    text_color = "#721C24"  # Dark red text for failure

# Display the Plotly chart
st.plotly_chart(fig, use_column_width=True)  # Set use_column_width=True for responsive resizing

# Apply HTML styling with the correct box color
st.markdown(f"""
    <div style="background-color:{box_color}; padding: 15px; border-radius: 5px;">
        <h3 style="color:{text_color};"<strong>{status}</strong></h3>
        <p style="color:{text_color};">{recommendation}</p>
    </div>
""", unsafe_allow_html=True)

# Display Summary with Columns for Better Layout
st.header("สรุปข้อมูล แผนเกษียณของคุณ")

# Create two columns for better layout
col1, col2 = st.columns(2)

# Column 1: Personal and Retirement Info
with col1:
    st.subheader("ข้อมูลส่วนตัว")
    st.markdown(f"""
    - อายุปัจจุบัน: {current_age} ปี  
    - อายุเกษียณ: {retirement_age} ปี  
    - อายุขัย: {life_expectancy} ปี  
    """)
    
    st.subheader("ค่าใช้จ่ายหลังเกษียณ")
    st.markdown(f"""
    - [NEED] ค่าใช้จ่ายจำเป็นต่อเดือน หลังเกษียณ: **฿{need_expense:,.0f}**
    - [WANT] ค่าใช้จ่ายพิเศษต่อเดือน หลังเกษียณ: **฿{want_expense:,.0f}**
    - [HEALTH] เบี้ยประกันสุขภาพ หลังเกษียณ: **฿{health_insurance_expense:,.0f}**
    - [HEALTH] ทุนค่าใช้จ่ายอื่น ๆ ด้านสุขภาพ หลังเกษียณ: **฿{health_risk_expense:,.0f}**
    - [ETC.] ค่าใช้จ่ายพิเศษอื่น ๆ: **฿{etc_expense:,.0f}**
    """)

# Column 2: Expenses and Returns
with col2:
    st.subheader("เงินทุนตั้งต้นและการลงทุน")
    st.markdown(f"""
    - เงินทุนตั้งต้น: **฿{starting_principal:,.0f}**
    - เงินลงทุนเพิ่มต่อเดือน: **฿{annual_contribution / 12:,.0f}**
    - เงินทุนเกษียณ: **฿{retire_fund[0]:,.0f}**
    """)

    st.subheader("เงินเฟ้อ และผลตอบแทน")
    st.markdown(f"""
    - เงินเฟ้อ: **{inflation_rate * 100:.1f}%** ต่อปี  
    - ผลตอบแทนคาดหวัง (ระยะสะสม): **{annualized_return_pre * 100:.1f}%**
    - ผลตอบแทนคาดหวัง (ระยะใกล้เกษียณ): **{annualized_return_final_years * 100:.1f}%**
    - ระยะปรับพอร์ตการลงทุนก่อนเกษียณ: **{years_final_return}** ปี
    - ผลตอบแทนคาดหวัง (ระยะหลังเกษียณ): **{annualized_return_post * 100:.1f}%**  
    """)

st.markdown(f"""*หมายเหตุ: เครื่องมือชิ้นนี้จะเน้นวางแผนการเกษียณในระยะสะสม แต่จะยังไม่ได้ลงรายละเอียดในส่วนการวางแผนการลงทุนหลังวัยเกษียณ ซึ่งจะมีรายละเอียดเพิ่มเติมมากกว่านี้ 
            และหากท่านใดมีไอเดียดี ๆ อยากส่งให้ทีมงานปรับปรุงและพัฒนาสามารถทักเข้ามาได้ที่ isarawealth@gmail.com ได้เลยครับ""")

box_color = "#c0c5cc"

st.markdown(f"""
    <div style="background-color:{box_color}; padding: 15px; border-radius: 5px;">
    จัดทำโดย นพ.ณัฐธนภพ อิศรเดช (หมอเฟ้น)
    - แพทย์ และนักวิจัย: Machine Learning, Clinical NLP, Clinical Epidemiology
    - เจ้าของบล็อก www.isarawealth.com
    - IP License No. 132355 ใบอนุญาตผู้วางแผนการลงทุน โดย กลต.
    - ที่ปรึกษาทางการเงิน บลน. Finnomena
    - ตัวแทนประกันชีวิตและ Unitlink AIA รหัส 692246
    </div>
""", unsafe_allow_html=True)
