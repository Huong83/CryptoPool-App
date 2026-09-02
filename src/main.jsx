  ? "Ví mô phỏng đã kết nối · chưa có dữ liệu giao dịch"
                    : "Kết nối ví để xem danh mục"}
                </div>

                <div className="chartHeader">
                  <span>Portfolio overview</span>
                  <span>DEMO</span>
                </div>

                <div className="spark">
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                </div>

                <div className="chartFooter">
                  <span>24H</span>
                  <span>7D</span>
                  <span>30D</span>
                  <span>ALL</span>
                </div>
              </div>
            </section>

            <section className="stats">
              <Stat
                label="Tổng TVL demo"
                value="$3.56M"
                note="Dữ liệu giao diện mẫu"
              />

              <Stat
                label="Investment Pools"
                value="08"
                note="Nhiều mức rủi ro"
              />

              <Stat
                label="Giao dịch"
                value="—"
                note="Chờ blockchain/API"
              />

              <Stat
                label="Trạng thái"
                value="MVP"
                note="Prototype an toàn"
              />
            </section>

            <section className="section quickSection">
              <div className="sectionHead">
                <div>
                  <div className="eyebrow">EXPLORE</div>
                  <h2>Khám phá CryptoPool</h2>
                  <p>
                    Một nền tảng được thiết kế để dữ liệu và rủi ro được trình
                    bày rõ ràng trước khi triển khai chức năng tài chính thật.
                  </p>
                </div>
              </div>

              <div className="featureGrid">
                <Feature
                  icon="◈"
                  title="Đa chiến lược"
                  text="Theo dõi nhiều nhóm tài sản và mức rủi ro trong một giao diện."
                />

                <Feature
                  icon="↗"
                  title="Dữ liệu minh bạch"
                  text="Thiết kế sẵn cho việc tích hợp dữ liệu thị trường và on-chain."
                />

                <Feature
                  icon="◇"
                  title="An toàn trước tiên"
                  text="Phiên bản hiện tại không nhận tiền và không yêu cầu private key."
                />
              </div>
            </section>
          </>
        )}

        {tab === "Pools" && (
          <section className="section">
            <div className="sectionHead">
              <div>
                <div className="eyebrow">STRATEGIES</div>
                <h2>Investment Pools</h2>
                <p>
                  Khám phá các chiến lược theo mức rủi ro. Các chỉ số hiệu suất
                  thực tế sẽ chỉ được hiển thị sau khi tích hợp nguồn dữ liệu
                  xác thực.
                </p>
              </div>

              <div className="filters">
                {["Tất cả", "Thấp", "Trung bình", "Cao", "Rất cao"].map(
                  (item) => (
                    <button
                      key={item}
                      className={filter === item ? "filter active" : "filter"}
                      onClick={() => setFilter(item)}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="poolGrid">
              {visiblePools.map((pool) => (
                <article
                  className="poolCard"
                  key={pool.name}
                  style={{ "--pool": pool.color }}
                >
                  <div className="poolHeader">
                    <div className="coin">{pool.symbol}</div>
                    <span className="risk">{pool.risk}</span>
                  </div>

                  <h3>{pool.name}</h3>

                  <p className="desc">{pool.desc}</p>

                  <div className="metric">
                    <span>Hiệu suất</span>
                    <strong>{pool.apy}</strong>
                  </div>

                  <div className="rows">
                    <div>
                      <span>TVL</span>
                      <b>{pool.tvl}</b>
                    </div>

                    <div>
                      <span>Phí</span>
                      <b>{pool.fee}</b>
                    </div>
                  </div>

                  <button
                    className="outline"
                    onClick={() => setSelected(pool)}
                  >
                    Xem chi tiết →
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "Portfolio" && (
          <Placeholder
            title="Portfolio"
            text={
              connected
                ? "Ví mô phỏng đã kết nối. Chưa có dữ liệu tài sản thật để hiển thị."
                : "Kết nối ví để xem portfolio. CryptoPool không lưu seed phrase hoặc private key."
            }
          />
        )}

        {tab === "Transactions" && (
          <Placeholder
            title="Transactions"
            text="Lịch sử giao dịch sẽ được tích hợp từ blockchain/API trong phiên bản backend tiếp theo."
          />
        )}
      </main>

      <footer>
        <span>CryptoPool · MVP 1.0</span>
        <span>Không cam kết lợi nhuận · Dữ liệu demo</span>
      </footer>

      {selected && (
        <div
          className="modalBg"

