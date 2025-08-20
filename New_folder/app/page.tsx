import SearchBar from "@/components/SearchBar";
import FeaturedTournaments from "@/components/FeaturedTournaments";
import { readAllTournaments } from "@/lib/tournamentStorage";

export const revalidate = 300; // ISR: refresh data every 5 minutes

export default function HomePage() {
  const tournaments = readAllTournaments();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-primary">Sports India</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover and join tournaments across India. From Badminton to Chess, Carrom to Tennis - find your next competitive challenge.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Featured Tournaments</h2>
          <FeaturedTournaments tournaments={tournaments} />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">{tournaments.length}</div>
              <div className="text-gray-600">Active Tournaments</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">32</div>
              <div className="text-gray-600">Max Participants per Tournament</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">Multiple</div>
              <div className="text-gray-600">Sports Supported</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Compete?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Browse tournaments, find your perfect match, and start your competitive journey today.
          </p>
          <a
            href="/tournaments"
            className="inline-block bg-primary text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Browse All Tournaments
          </a>
        </div>
      </section>
    </div>
  );
}
