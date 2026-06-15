import { useState, useMemo } from "react";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MESES_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const DIAS_MES = [31,28,31,30,31,30,31,31,30,31,30,31];

const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtShort = (v) => {
  const abs = Math.abs(v);
  if (abs >= 1000) return (v < 0 ? "-" : "") + "R$" + (abs/1000).toFixed(1).replace(".",",") + "k";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

function getStatus(performance) {
  if (performance > 5000) return { label: "Excelente", emoji:"🔥", cor:"#22c55e", nivel:100, msg:"Suas finanças estão no verde!" };
  if (performance > 2000) return { label: "Ótimo",     emoji:"😊", cor:"#4ade80", nivel:80,  msg:"Você está no caminho certo." };
  if (performance > 500)  return { label: "Bom",       emoji:"👍", cor:"#86efac", nivel:60,  msg:"Saldo positivo, continue assim!" };
  if (performance > 0)    return { label: "Ok",         emoji:"🙂", cor:"#bbf7d0", nivel:45,  msg:"Pequeno saldo positivo." };
  if (performance === 0)  return { label: "Neutro",     emoji:"⚖️", cor:"#fbbf24", nivel:30,  msg:"Entradas iguais às saídas." };
  if (performance > -500) return { label: "Atenção",   emoji:"🌡️", cor:"#fed7aa", nivel:28,  msg:"Pequeno déficit este mês." };
  if (performance > -2000)return { label: "Alerta",    emoji:"⚠️", cor:"#fca5a5", nivel:22,  msg:"Fique de olho nos gastos." };
  if (performance > -5000)return { label: "Ruim",      emoji:"😟", cor:"#f87171", nivel:15,  msg:"Saídas superam as entradas." };
  return                         { label: "Crítico",    emoji:"❄️", cor:"#ef4444", nivel:5,   msg:"Déficit alto! Atenção urgente." };
}

// ─── Thermometer SVG ───────────────────────────────────────────────
function Thermo({ nivel, cor, size = 80 }) {
  const h = size * 1.8;
  const fill = (nivel / 100) * (h - 20);
  return (
    <svg width={size * 0.5} height={h} viewBox={`0 0 30 ${h}`}>
      <circle cx="15" cy={h - 8} r="10" fill="#0f172a" />
      <circle cx="15" cy={h - 8} r="7.5" fill={cor} style={{ transition:"fill 0.8s" }} />
      <rect x="11" y="6" width="8" height={h - 20} rx="4" fill="#0f172a" />
      <rect x="12.5" y={6 + (h - 20 - fill)} width="5" height={fill} rx="3" fill={cor} style={{ transition:"all 0.8s ease" }} />
      {[0,25,50,75,100].map(p => (
        <line key={p} x1="19" y1={6 + (h-20) - (p/100)*(h-20)} x2="23" y2={6 + (h-20) - (p/100)*(h-20)} stroke="#334155" strokeWidth="1" />
      ))}
    </svg>
  );
}

// ─── Bottom Sheet Modal ─────────────────────────────────────────────
function BottomSheet({ onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div onClick={onClose} style={{ flex:1, background:"rgba(0,0,0,0.6)" }} />
      <div style={{
        background:"#1a2540", borderRadius:"24px 24px 0 0",
        padding:"0 0 32px",
        maxHeight:"92vh", overflowY:"auto",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.5)"
      }}>
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div style={{ width:36, height:4, borderRadius:2, background:"#334155" }} />
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Modal Lançamento ───────────────────────────────────────────────
function ModalLancamento({ info, onConfirm, onClose }) {
  const { mes, dia } = info;
  const [tipo, setTipo] = useState(info.tipo || "saida");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [parcelas, setParcelas] = useState(1);

  const valorNum = parseFloat(valor.replace(",",".")) || 0;
  const valorParcela = parcelas > 0 ? valorNum / parcelas : 0;

  const inp = {
    background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:12,
    color:"#f1f5f9", padding:"13px 14px", fontSize:15, width:"100%",
    outline:"none", fontFamily:"inherit", boxSizing:"border-box",
    WebkitAppearance:"none"
  };

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ padding:"8px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#f1f5f9" }}>Novo Lançamento</h2>
            <p style={{ margin:"3px 0 0", fontSize:12, color:"#64748b" }}>Dia {dia} · {MESES[mes]}</p>
          </div>
          <button onClick={onClose} style={{ background:"#0d1b2e", border:"none", color:"#64748b", fontSize:18, cursor:"pointer", width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        {/* Tipo */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
          {[["entrada","⬆️ Entrada","#16a34a"],["saida","⬇️ Saída","#dc2626"]].map(([t,label,c]) => (
            <button key={t} onClick={() => setTipo(t)} style={{
              padding:"13px", borderRadius:14, border:`2px solid ${tipo===t ? c : "transparent"}`,
              cursor:"pointer", fontWeight:700, fontSize:14,
              background: tipo===t ? c+"22" : "#0d1b2e",
              color: tipo===t ? (t==="entrada" ? "#4ade80" : "#f87171") : "#475569",
              transition:"all 0.2s"
            }}>{label}</button>
          ))}
        </div>

        {/* Descrição */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, color:"#475569", display:"block", marginBottom:6, letterSpacing:1 }}>DESCRIÇÃO</label>
          <input type="text" placeholder="Ex: Salário, Aluguel, Mercado…" value={descricao}
            onChange={e => setDescricao(e.target.value)} style={inp} />
        </div>

        {/* Valor */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, color:"#475569", display:"block", marginBottom:6, letterSpacing:1 }}>VALOR TOTAL (R$)</label>
          <input type="number" min="0" step="0.01" placeholder="0,00" value={valor}
            onChange={e => setValor(e.target.value)}
            style={{ ...inp, fontSize:22, fontWeight:800, color: tipo==="entrada" ? "#4ade80" : "#f87171" }} />
        </div>

        {/* Parcelas */}
        <div style={{ marginBottom:18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
            <label style={{ fontSize:11, color:"#475569", letterSpacing:1 }}>PARCELAS</label>
            <span style={{ fontSize:13, fontWeight:700, color:"#3b82f6" }}>{parcelas}x {valorNum > 0 && parcelas > 1 ? `· ${fmt(valorParcela)}/mês` : ""}</span>
          </div>

          {/* Chips de parcelas */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {[1,2,3,4,5,6,8,10,12,18,24].map(n => (
              <button key={n} onClick={() => setParcelas(n)} style={{
                padding:"7px 12px", borderRadius:20, border:"none", cursor:"pointer",
                fontSize:13, fontWeight:700,
                background: parcelas===n ? "#3b82f6" : "#0d1b2e",
                color: parcelas===n ? "#fff" : "#475569",
                transition:"all 0.15s"
              }}>{n}x</button>
            ))}
          </div>

          {/* Preview parcelas */}
          {parcelas > 1 && valorNum > 0 && (
            <div style={{ marginTop:14, background:"#0d1b2e", borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"10px 14px", borderBottom:"1px solid #1e3a5f" }}>
                <span style={{ fontSize:11, color:"#475569", letterSpacing:1 }}>PRÉVIA</span>
              </div>
              <div style={{ maxHeight:150, overflowY:"auto" }}>
                {Array.from({ length: parcelas }, (_, i) => {
                  const m = (mes + i) % 12;
                  return (
                    <div key={i} style={{
                      display:"flex", justifyContent:"space-between", padding:"9px 14px",
                      borderBottom: i < parcelas-1 ? "1px solid #0f172a" : "none"
                    }}>
                      <span style={{ fontSize:13, color:"#64748b" }}>
                        <span style={{ color:"#3b82f6", fontWeight:700 }}>{i+1}/{parcelas}</span>
                        {" · "}{MESES[m]}
                      </span>
                      <span style={{ fontSize:13, fontWeight:700, fontFamily:"monospace", color: tipo==="entrada" ? "#4ade80" : "#f87171" }}>
                        {fmt(valorParcela)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => { if (!valorNum) return; onConfirm({ tipo, descricao, valorTotal: valorNum, valorParcela, parcelas, mesPrimeiro: mes, diaPrimeiro: dia }); }}
          style={{
            width:"100%", padding:"15px", borderRadius:16, border:"none",
            background: tipo==="entrada" ? "linear-gradient(135deg,#16a34a,#4ade80)" : "linear-gradient(135deg,#dc2626,#f87171)",
            color:"#fff", cursor:"pointer", fontWeight:800, fontSize:16,
            opacity: valorNum ? 1 : 0.4, transition:"opacity 0.2s"
          }}
        >
          {parcelas === 1 ? `Lançar ${fmt(valorNum)}` : `Lançar ${parcelas}x de ${fmt(valorParcela)}`}
        </button>
      </div>
    </BottomSheet>
  );
}

// ─── Modal Detalhe Lançamento ───────────────────────────────────────
function ModalDetalhe({ lancamento, onDelete, onClose }) {
  const l = lancamento;
  const status = l.tipo === "entrada" ? { cor:"#4ade80", bg:"#16a34a22", label:"Entrada" } : { cor:"#f87171", bg:"#dc262622", label:"Saída" };
  return (
    <BottomSheet onClose={onClose}>
      <div style={{ padding:"8px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
          <div>
            <div style={{ display:"inline-block", background:status.bg, color:status.cor, borderRadius:8, padding:"3px 10px", fontSize:11, fontWeight:700, marginBottom:6 }}>
              {l.tipo === "entrada" ? "⬆️" : "⬇️"} {status.label}
            </div>
            <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#f1f5f9" }}>{l.descricao || "(sem descrição)"}</h2>
            <p style={{ margin:"4px 0 0", fontSize:12, color:"#64748b" }}>
              {l.parcelas}x de {fmt(l.valorParcela)} · Total {fmt(l.valorParcela * l.parcelas)}
            </p>
          </div>
          <button onClick={onClose} style={{ background:"#0d1b2e", border:"none", color:"#64748b", fontSize:18, cursor:"pointer", width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        <div style={{ background:"#0d1b2e", borderRadius:14, overflow:"hidden", marginBottom:18 }}>
          <div style={{ padding:"10px 14px", borderBottom:"1px solid #1e3a5f" }}>
            <span style={{ fontSize:11, color:"#475569", letterSpacing:1 }}>PARCELAS</span>
          </div>
          <div style={{ maxHeight:220, overflowY:"auto" }}>
            {Array.from({ length: l.parcelas }, (_, i) => {
              const m = (l.mesPrimeiro + i) % 12;
              return (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", borderBottom: i < l.parcelas-1 ? "1px solid #0f172a" : "none" }}>
                  <span style={{ fontSize:13, color:"#64748b" }}>
                    <span style={{ color:"#3b82f6", fontWeight:700 }}>{i+1}/{l.parcelas}</span>
                    {" · "}Dia {l.diaPrimeiro} · {MESES[m]}
                  </span>
                  <span style={{ fontSize:13, fontWeight:700, fontFamily:"monospace", color:status.cor }}>{fmt(l.valorParcela)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={() => { onDelete(l.id); onClose(); }} style={{
          width:"100%", padding:"14px", borderRadius:14, border:"none",
          background:"#7f1d1d22", color:"#f87171", cursor:"pointer", fontWeight:700, fontSize:14,
          border:"1px solid #7f1d1d"
        }}>
          🗑️ Excluir lançamento
        </button>
      </div>
    </BottomSheet>
  );
}

// ─── TELA HOME ──────────────────────────────────────────────────────
function TelaHome({ lancamentos, mesSel, setMesSel, resAnual, resMes, setModal, setVerParcelas }) {
  const termometro = getStatus(resMes.performance);
  const hoje = new Date().getDate();

  return (
    <div style={{ flex:1, overflowY:"auto", paddingBottom:80 }}>
      {/* Hero card */}
      <div style={{
        margin:"16px 16px 0",
        background:"linear-gradient(145deg, #1a2f52 0%, #0d1b2e 100%)",
        borderRadius:24, padding:"20px 20px 16px",
        border:`1px solid ${termometro.cor}33`,
        position:"relative", overflow:"hidden"
      }}>
        {/* Glow */}
        <div style={{ position:"absolute", top:-40, right:-40, width:120, height:120, borderRadius:"50%", background:termometro.cor, opacity:0.08, filter:"blur(30px)" }} />

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:"#475569", letterSpacing:1, marginBottom:4 }}>PERFORMANCE — {MESES[mesSel].toUpperCase()}</div>
            <div style={{ fontSize:32, fontWeight:900, color: termometro.cor, lineHeight:1 }}>
              {fmtShort(resMes.performance)}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:8 }}>
              <span style={{ fontSize:18 }}>{termometro.emoji}</span>
              <span style={{ fontSize:14, fontWeight:700, color:termometro.cor }}>{termometro.label}</span>
              <span style={{ fontSize:12, color:"#475569" }}>· {termometro.msg}</span>
            </div>
          </div>
          <Thermo nivel={termometro.nivel} cor={termometro.cor} size={60} />
        </div>

        {/* Mini stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:16 }}>
          <div style={{ background:"#ffffff0a", borderRadius:12, padding:"10px 12px" }}>
            <div style={{ fontSize:10, color:"#475569", marginBottom:2 }}>⬆️ ENTRADAS</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#4ade80", fontFamily:"monospace" }}>{fmtShort(resMes.totalEntradas)}</div>
          </div>
          <div style={{ background:"#ffffff0a", borderRadius:12, padding:"10px 12px" }}>
            <div style={{ fontSize:10, color:"#475569", marginBottom:2 }}>⬇️ SAÍDAS</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#f87171", fontFamily:"monospace" }}>{fmtShort(resMes.totalSaidas)}</div>
          </div>
        </div>
      </div>

      {/* Seletor de mês scroll horizontal */}
      <div style={{ overflowX:"auto", display:"flex", gap:8, padding:"16px 16px 4px", scrollbarWidth:"none" }}>
        {MESES.map((_, i) => {
          const r = resAnual[i];
          const ativo = mesSel === i;
          const temDados = r.totalEntradas > 0 || r.totalSaidas > 0;
          const s = getStatus(r.performance);
          return (
            <button key={i} onClick={() => setMesSel(i)} style={{
              flexShrink:0, padding:"8px 14px", borderRadius:20, border:"none", cursor:"pointer",
              background: ativo ? "#3b82f6" : temDados ? "#1a2540" : "#0d1b2e",
              color: ativo ? "#fff" : temDados ? s.cor : "#334155",
              fontWeight:700, fontSize:13, transition:"all 0.2s",
              border: ativo ? "2px solid #60a5fa" : "2px solid transparent",
              position:"relative"
            }}>
              {MESES_SHORT[i]}
              {temDados && !ativo && <span style={{ position:"absolute", top:3, right:4, width:5, height:5, borderRadius:"50%", background:s.cor }} />}
            </button>
          );
        })}
      </div>

      {/* Lançamentos do mês */}
      <div style={{ padding:"12px 16px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <span style={{ fontSize:13, fontWeight:700, color:"#94a3b8" }}>Lançamentos · {MESES[mesSel]}</span>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setModal({ mes:mesSel, dia:hoje, tipo:"entrada" })} style={{
              padding:"7px 12px", borderRadius:10, border:"none", cursor:"pointer",
              background:"#16a34a22", color:"#4ade80", fontWeight:700, fontSize:12
            }}>⬆️ Entrada</button>
            <button onClick={() => setModal({ mes:mesSel, dia:hoje, tipo:"saida" })} style={{
              padding:"7px 12px", borderRadius:10, border:"none", cursor:"pointer",
              background:"#dc262622", color:"#f87171", fontWeight:700, fontSize:12
            }}>⬇️ Saída</button>
          </div>
        </div>

        {/* Lista de dias com lançamentos */}
        {resMes.linhas.filter(l => l.itens.length > 0).length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 20px", color:"#334155" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <div style={{ fontSize:14, fontWeight:600 }}>Nenhum lançamento em {MESES[mesSel]}</div>
            <div style={{ fontSize:12, marginTop:4 }}>Toque em Entrada ou Saída para começar</div>
          </div>
        ) : (
          resMes.linhas.filter(l => l.itens.length > 0).map(({ dia, entrada, saida, saldo, itens }) => (
            <div key={dia} style={{ background:"#1a2540", borderRadius:16, marginBottom:10, overflow:"hidden" }}>
              {/* Cabeçalho do dia */}
              <div style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"10px 14px", background:"#1e2f4a",
                borderBottom:"1px solid #0d1b2e"
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ background:"#3b82f622", borderRadius:8, padding:"3px 8px", fontSize:12, fontWeight:800, color:"#60a5fa" }}>{dia}</div>
                  <span style={{ fontSize:11, color:"#475569" }}>{MESES[mesSel]}</span>
                </div>
                <div style={{ display:"flex", gap:12 }}>
                  {entrada > 0 && <span style={{ fontSize:12, color:"#4ade80", fontFamily:"monospace", fontWeight:700 }}>+{fmtShort(entrada)}</span>}
                  {saida > 0 && <span style={{ fontSize:12, color:"#f87171", fontFamily:"monospace", fontWeight:700 }}>-{fmtShort(saida)}</span>}
                </div>
              </div>
              {/* Itens */}
              {itens.map((item, idx) => (
                <div key={idx} onClick={() => setVerParcelas(item.id)}
                  style={{
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"11px 14px", cursor:"pointer",
                    borderBottom: idx < itens.length-1 ? "1px solid #0d1b2e" : "none",
                    transition:"background 0.15s"
                  }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{
                      width:32, height:32, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
                      background: item.tipo === "entrada" ? "#16a34a22" : "#dc262622",
                      fontSize:15
                    }}>
                      {item.tipo === "entrada" ? "⬆️" : "⬇️"}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0" }}>{item.descricao || "(sem descrição)"}</div>
                      {item.parcelas > 1 && (
                        <div style={{ fontSize:11, color:"#3b82f6", marginTop:1 }}>Parcela {item.parcela}/{item.parcelas}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:14, fontWeight:700, fontFamily:"monospace", color: item.tipo === "entrada" ? "#4ade80" : "#f87171" }}>
                      {item.tipo === "entrada" ? "+" : "-"}{fmt(item.valorParcela)}
                    </div>
                  </div>
                </div>
              ))}
              {/* Saldo do dia */}
              <div style={{ padding:"8px 14px", background:"#0d1b2e22", display:"flex", justifyContent:"flex-end" }}>
                <span style={{ fontSize:11, color:"#475569" }}>Saldo acum.: </span>
                <span style={{ fontSize:11, fontWeight:700, fontFamily:"monospace", color: saldo >= 0 ? "#60a5fa" : "#f87171", marginLeft:4 }}>
                  {fmt(saldo)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setModal({ mes:mesSel, dia:hoje, tipo:"saida" })} style={{
        position:"fixed", bottom:88, right:20,
        width:56, height:56, borderRadius:28, border:"none",
        background:"linear-gradient(135deg,#3b82f6,#60a5fa)",
        color:"#fff", fontSize:26, cursor:"pointer",
        boxShadow:"0 4px 20px rgba(59,130,246,0.5)",
        display:"flex", alignItems:"center", justifyContent:"center",
        zIndex:50
      }}>+</button>
    </div>
  );
}

// ─── TELA ANUAL ─────────────────────────────────────────────────────
function TelaAnual({ resAnual, setMesSel, setTab }) {
  const totalPerf = resAnual.reduce((a,m) => a + m.performance, 0);
  const totalE = resAnual.reduce((a,m) => a + m.totalEntradas, 0);
  const totalS = resAnual.reduce((a,m) => a + m.totalSaidas, 0);
  const s = getStatus(totalPerf);

  return (
    <div style={{ flex:1, overflowY:"auto", paddingBottom:80 }}>
      {/* Header anual */}
      <div style={{ margin:"16px 16px 0", background:"linear-gradient(145deg,#1a2f52,#0d1b2e)", borderRadius:24, padding:"20px", border:`1px solid ${s.cor}33` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:11, color:"#475569", letterSpacing:1, marginBottom:4 }}>PERFORMANCE ANUAL</div>
            <div style={{ fontSize:30, fontWeight:900, color:s.cor }}>{fmtShort(totalPerf)}</div>
            <div style={{ fontSize:13, fontWeight:600, color:s.cor, marginTop:4 }}>{s.emoji} {s.label} · {s.msg}</div>
          </div>
          <Thermo nivel={s.nivel} cor={s.cor} size={55} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:16 }}>
          <div style={{ background:"#ffffff0a", borderRadius:12, padding:"10px 12px" }}>
            <div style={{ fontSize:10, color:"#475569", marginBottom:2 }}>⬆️ ENTRADAS</div>
            <div style={{ fontSize:15, fontWeight:700, color:"#4ade80", fontFamily:"monospace" }}>{fmtShort(totalE)}</div>
          </div>
          <div style={{ background:"#ffffff0a", borderRadius:12, padding:"10px 12px" }}>
            <div style={{ fontSize:10, color:"#475569", marginBottom:2 }}>⬇️ SAÍDAS</div>
            <div style={{ fontSize:15, fontWeight:700, color:"#f87171", fontFamily:"monospace" }}>{fmtShort(totalS)}</div>
          </div>
        </div>
      </div>

      {/* Grid meses */}
      <div style={{ padding:"16px 16px 0" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#475569", letterSpacing:1, marginBottom:12 }}>MESES</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {resAnual.map(({ mes, totalEntradas, totalSaidas, performance }) => {
            const t = getStatus(performance);
            const tem = totalEntradas > 0 || totalSaidas > 0;
            return (
              <div key={mes}
                onClick={() => { setMesSel(mes); setTab("home"); }}
                style={{
                  background: tem ? "#1a2540" : "#0d1b2e",
                  borderRadius:16, padding:"14px 12px",
                  border:`1px solid ${tem ? t.cor+"33" : "#1e3a5f22"}`,
                  cursor:"pointer", opacity: tem ? 1 : 0.5
                }}
              >
                <div style={{ fontSize:11, fontWeight:700, color:"#64748b", marginBottom:6 }}>{MESES_SHORT[mes].toUpperCase()}</div>
                {tem ? (
                  <>
                    <div style={{ fontSize:15, fontWeight:800, color:t.cor }}>{fmtShort(performance)}</div>
                    <div style={{ fontSize:10, color:t.cor, marginTop:2 }}>{t.emoji} {t.label}</div>
                    <div style={{ display:"flex", gap:1, marginTop:8, alignItems:"flex-end", height:20 }}>
                      {(() => {
                        const max = Math.max(totalEntradas, totalSaidas, 1);
                        return <>
                          <div style={{ flex:1, height: Math.max(2,(totalEntradas/max)*18), background:"#22c55e44", borderRadius:2 }} />
                          <div style={{ flex:1, height: Math.max(2,(totalSaidas/max)*18), background:"#ef444444", borderRadius:2 }} />
                        </>;
                      })()}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize:10, color:"#334155", marginTop:4 }}>Sem dados</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ──────────────────────────────────────────────────
export default function App() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();

  const [lancamentos, setLancamentos] = useState([]);
  const [mesSel, setMesSel] = useState(mesAtual);
  const [tab, setTab] = useState("home");
  const [modal, setModal] = useState(null);
  const [verParcelas, setVerParcelas] = useState(null);

  const confirmarLancamento = (dados) => {
    setLancamentos(prev => [...prev, { id: Date.now(), ...dados }]);
    setModal(null);
  };

  const calcMes = (m) => {
    const mapa = {};
    for (let d = 1; d <= DIAS_MES[m]; d++) mapa[d] = { entrada:0, saida:0, itens:[] };
    lancamentos.forEach(l => {
      for (let p = 0; p < l.parcelas; p++) {
        if ((l.mesPrimeiro + p) % 12 === m) {
          const dia = Math.min(l.diaPrimeiro, DIAS_MES[m]);
          if (l.tipo === "entrada") mapa[dia].entrada += l.valorParcela;
          else mapa[dia].saida += l.valorParcela;
          mapa[dia].itens.push({ id:l.id, descricao:l.descricao, tipo:l.tipo, valorParcela:l.valorParcela, parcela:p+1, parcelas:l.parcelas });
        }
      }
    });
    let totalEntradas=0, totalSaidas=0, saldoAcum=0;
    const linhas = [];
    for (let dia = 1; dia <= DIAS_MES[m]; dia++) {
      const { entrada, saida, itens } = mapa[dia];
      saldoAcum += entrada - saida;
      totalEntradas += entrada; totalSaidas += saida;
      linhas.push({ dia, entrada, saida, diario:entrada-saida, saldo:saldoAcum, itens });
    }
    return { totalEntradas, totalSaidas, saidaTotal:totalSaidas, performance:totalEntradas-totalSaidas, linhas };
  };

  const resMes = useMemo(() => calcMes(mesSel), [lancamentos, mesSel]);
  const resAnual = useMemo(() => MESES.map((_, i) => ({ mes:i, ...calcMes(i) })), [lancamentos]);
  const lancSel = verParcelas ? lancamentos.find(l => l.id === verParcelas) : null;

  const TABS = [
    { id:"home", icon:"🏠", label:"Início" },
    { id:"anual", icon:"📊", label:"Anual" },
  ];

  return (
    <div style={{
      display:"flex", justifyContent:"center", alignItems:"center",
      minHeight:"100vh",
      background:"#060d1a",
      fontFamily:"'Inter', system-ui, sans-serif"
    }}>
      {/* Shell do celular */}
      <div style={{
        width:390, height:844,
        background:"#0d1b2e",
        borderRadius:44,
        boxShadow:"0 0 0 8px #1a2540, 0 30px 80px rgba(0,0,0,0.8), inset 0 0 0 1px #1e3a5f",
        display:"flex", flexDirection:"column",
        overflow:"hidden",
        position:"relative",
        color:"#e2e8f0"
      }}>

        {/* Status bar */}
        <div style={{
          height:44, display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 24px 0 20px", background:"#0d1b2e", flexShrink:0
        }}>
          <span style={{ fontSize:13, fontWeight:700, color:"#94a3b8" }}>9:41</span>
          <div style={{ width:120, height:24, background:"#0d1b2e", borderRadius:12, position:"absolute", left:"50%", transform:"translateX(-50%)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:60, height:14, background:"#060d1a", borderRadius:8 }} />
          </div>
          <div style={{ display:"flex", gap:5, alignItems:"center" }}>
            <span style={{ fontSize:11, color:"#94a3b8" }}>▊▊▊</span>
            <span style={{ fontSize:11, color:"#94a3b8" }}>WiFi</span>
            <span style={{ fontSize:11, color:"#94a3b8" }}>🔋</span>
          </div>
        </div>

        {/* App header */}
        <div style={{
          padding:"6px 20px 10px",
          background:"#0d1b2e",
          flexShrink:0,
          borderBottom:"1px solid #1a2540"
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:22 }}>🌡️</span>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:"#f1f5f9", lineHeight:1 }}>Termômetro</div>
                <div style={{ fontSize:11, color:"#475569" }}>Financeiro · {anoAtual}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
          {tab === "home" && (
            <TelaHome
              lancamentos={lancamentos}
              mesSel={mesSel}
              setMesSel={setMesSel}
              resAnual={resAnual}
              resMes={resMes}
              setModal={setModal}
              setVerParcelas={setVerParcelas}
            />
          )}
          {tab === "anual" && (
            <TelaAnual resAnual={resAnual} setMesSel={setMesSel} setTab={setTab} />
          )}
        </div>

        {/* Bottom Navigation */}
        <div style={{
          height:70, background:"#0d1b2e",
          borderTop:"1px solid #1a2540",
          display:"flex", alignItems:"center",
          paddingBottom:4, flexShrink:0, position:"relative"
        }}>
          {/* Início */}
          <button onClick={() => setTab("home")} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            background:"none", border:"none", cursor:"pointer", padding:"8px 0"
          }}>
            <span style={{ fontSize:20 }}>🏠</span>
            <span style={{ fontSize:10, fontWeight:700, color: tab==="home" ? "#3b82f6" : "#334155" }}>Início</span>
            {tab==="home" && <div style={{ width:20, height:2, borderRadius:1, background:"#3b82f6" }} />}
          </button>

          {/* Botão + central */}
          <div style={{ flex:1, display:"flex", justifyContent:"center", alignItems:"center" }}>
            <button
              onClick={() => setModal({ mes:mesSel, dia:new Date().getDate(), tipo:"saida" })}
              style={{
                width:54, height:54, borderRadius:27, border:"none", cursor:"pointer",
                background:"linear-gradient(135deg, #3b82f6, #60a5fa)",
                boxShadow:"0 4px 20px rgba(59,130,246,0.55)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:28, color:"#fff", fontWeight:300,
                marginTop:-18,
                transition:"transform 0.15s",
              }}
            >+</button>
          </div>

          {/* Anual */}
          <button onClick={() => setTab("anual")} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            background:"none", border:"none", cursor:"pointer", padding:"8px 0"
          }}>
            <span style={{ fontSize:20 }}>📊</span>
            <span style={{ fontSize:10, fontWeight:700, color: tab==="anual" ? "#3b82f6" : "#334155" }}>Anual</span>
            {tab==="anual" && <div style={{ width:20, height:2, borderRadius:1, background:"#3b82f6" }} />}
          </button>
        </div>

        {/* Modais dentro do shell */}
        {modal && (
          <div style={{ position:"absolute", inset:0, zIndex:200 }}>
            <ModalLancamento info={modal} onConfirm={confirmarLancamento} onClose={() => setModal(null)} />
          </div>
        )}
        {lancSel && (
          <div style={{ position:"absolute", inset:0, zIndex:200 }}>
            <ModalDetalhe
              lancamento={lancSel}
              onDelete={(id) => setLancamentos(prev => prev.filter(l => l.id !== id))}
              onClose={() => setVerParcelas(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
