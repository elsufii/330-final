from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, Article, UserInteraction
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///wikitok.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Initialize database
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()
    # default user for testing (needs to be replaced for oauth)
    if not User.query.first():
        default_user = User(email='demo@wikitok.com', username='demo_user')
        db.session.add(default_user)
        db.session.commit()


# Helper function to get current user (placeholder for OAuth)
def get_current_user():
    """Placeholder - *** implement OAuth authentication"""
    # For now, return the default demo user
    return User.query.first()


# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500


# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'WikiTok API is running'})


# Article endpoints
@app.route('/api/articles', methods=['POST'])
def save_article():
    """Saving an article to the database"""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('id') or not data.get('title'):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if article already exists
        article = Article.query.filter_by(wiki_id=data['id']).first()
        
        if not article:
            article = Article(
                wiki_id=data['id'],
                title=data['title'],
                summary=data.get('summary', ''),
                url=data.get('url', ''),
                thumbnail=data.get('thumbnail')
            )
            db.session.add(article)
            db.session.commit()
        
        return jsonify({'message': 'Article saved', 'article': article.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/articles/<article_id>/like', methods=['POST'])
def like_article(article_id):
    """Like an article"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        # get or create article
        article = Article.query.filter_by(wiki_id=article_id).first()
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        interaction = UserInteraction.query.filter_by(
            user_id=user.id,
            article_id=article.id
        ).first()
        
        if not interaction:
            interaction = UserInteraction(
                user_id=user.id,
                article_id=article.id,
                liked=True,
                viewed=True
            )
            db.session.add(interaction)
        else:
            interaction.liked = True
        
        db.session.commit()
        return jsonify({'message': 'Article liked', 'interaction': interaction.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/articles/<article_id>/like', methods=['DELETE'])
def unlike_article(article_id):
    """Unlike an article"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        article = Article.query.filter_by(wiki_id=article_id).first()
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        interaction = UserInteraction.query.filter_by(
            user_id=user.id,
            article_id=article.id
        ).first()
        
        if interaction:
            interaction.liked = False
            db.session.commit()
        
        return jsonify({'message': 'Article unliked'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/articles/<article_id>/view', methods=['POST'])
def view_article(article_id):
    """Record article view"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        article = Article.query.filter_by(wiki_id=article_id).first()
        if not article:
            return jsonify({'error': 'Article not found'}), 404
        
        interaction = UserInteraction.query.filter_by(
            user_id=user.id,
            article_id=article.id
        ).first()
        
        if not interaction:
            interaction = UserInteraction(
                user_id=user.id,
                article_id=article.id,
                viewed=True
            )
            db.session.add(interaction)
        else:
            interaction.viewed = True
            interaction.viewed_at = datetime.utcnow()
        
        db.session.commit()
        return jsonify({'message': 'View recorded'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/articles/liked', methods=['GET'])
def get_liked_articles():
    """Get user's liked articles"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        # join query across all three tables
        liked_articles = db.session.query(Article).join(
            UserInteraction, Article.id == UserInteraction.article_id
        ).join(
            User, UserInteraction.user_id == User.id
        ).filter(
            User.id == user.id,
            UserInteraction.liked == True
        ).all()
        
        return jsonify({
            'articles': [article.to_dict() for article in liked_articles]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/articles/history', methods=['GET'])
def get_history():
    """Get user's viewing history"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        # join query with ordering
        viewed_articles = db.session.query(Article, UserInteraction.viewed_at).join(
            UserInteraction, Article.id == UserInteraction.article_id
        ).filter(
            UserInteraction.user_id == user.id,
            UserInteraction.viewed == True
        ).order_by(UserInteraction.viewed_at.desc()).all()
        
        articles = [
            {**article.to_dict(), 'viewed_at': viewed_at.isoformat()}
            for article, viewed_at in viewed_articles
        ]
        
        return jsonify({'articles': articles})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/user/stats', methods=['GET'])
def get_user_stats():
    """Get user statistics"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        
        total_viewed = UserInteraction.query.filter_by(
            user_id=user.id,
            viewed=True
        ).count()
        
        total_liked = UserInteraction.query.filter_by(
            user_id=user.id,
            liked=True
        ).count()
        
        return jsonify({
            'total_viewed': total_viewed,
            'total_liked': total_liked,
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
