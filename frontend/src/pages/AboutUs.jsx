import "./AboutUs.css";

function AboutUs() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <p className="about-eyebrow">WELCOME TO SOLESTYLE</p>
        <h1>Every Step Tells Your Story</h1>
        <p>
          Discover footwear that celebrates your style, confidence,
          and individuality.
        </p>
      </section>

      <section className="about-content">
        <div className="about-section">
          <h2>Who We Are</h2>
          <p>
            SOLESTYLE is a women's footwear destination created for
            women who want to express themselves through every step.
            From everyday comfort to special occasions, we bring
            together styles that complement your lifestyle.
          </p>
        </div>

        <div className="about-section">
          <h2>Our Collection</h2>
          <p>
            Explore sneakers for everyday adventures, elegant heels
            for memorable occasions, and versatile flats for effortless
            comfort. Find a pair that feels uniquely you.
          </p>
        </div>

        <div className="about-section">
          <h2>Our Mission</h2>
          <p>
            Our mission is to make discovering your next favourite
            pair simple, enjoyable, and inspiring. We believe the
            right footwear can add confidence to every step.
          </p>
        </div>
      </section>
    </main>
  );
}

export default AboutUs;